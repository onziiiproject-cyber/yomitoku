const GRAPH_API = "https://graph.facebook.com/v23.0";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Instagramのメディアコンテナは作成直後まだ処理中のことがあり、
// 未完了のまま公開しようとすると「Media ID is not available」で失敗する。
// status_codeがFINISHEDになるまで待ってから公開する。
async function waitForInstagramContainerReady(containerId: string, token: string): Promise<void> {
  for (let i = 0; i < 15; i++) {
    const res = await fetch(`${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`);
    const data = await res.json();
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") throw new Error(`Instagram container failed: ${JSON.stringify(data)}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Instagram container ${containerId} did not finish processing in time`);
}

// 複数枚（表紙＋3行まとめ）をFacebookページに投稿する
export async function postCarouselToFacebookPage(message: string, imageUrls: string[]): Promise<{ id: string }> {
  const pageId = requireEnv("FACEBOOK_PAGE_ID");
  const token = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");

  // 各画像を「未公開」でアップロードし、フィード投稿にまとめて添付する
  const photoIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      body: new URLSearchParams({ url, published: "false", access_token: token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Facebook photo upload failed: ${JSON.stringify(data)}`);
    photoIds.push(data.id);
  }

  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: "POST",
    body: new URLSearchParams({
      message,
      attached_media: JSON.stringify(photoIds.map((id) => ({ media_fbid: id }))),
      access_token: token,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Facebook feed post failed: ${JSON.stringify(data)}`);
  return data;
}

// 複数枚（表紙＋3行まとめ）をInstagramにカルーセル投稿する
export async function postCarouselToInstagram(imageUrls: string[], caption: string): Promise<{ id: string }> {
  const igId = requireEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID");
  const token = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");

  const childIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(`${GRAPH_API}/${igId}/media`, {
      method: "POST",
      body: new URLSearchParams({ image_url: url, is_carousel_item: "true", access_token: token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Instagram carousel item failed: ${JSON.stringify(data)}`);
    childIds.push(data.id);
  }

  const createRes = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: "POST",
    body: new URLSearchParams({
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
      access_token: token,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Instagram carousel create failed: ${JSON.stringify(createData)}`);

  await waitForInstagramContainerReady(createData.id, token);

  const publishRes = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: createData.id, access_token: token }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(`Instagram publish failed: ${JSON.stringify(publishData)}`);
  return publishData;
}

// 1枚だけをFacebookページに投稿する（放送室のエピソード告知など）
export async function postSingleToFacebookPage(message: string, imageUrl: string): Promise<{ id: string }> {
  const pageId = requireEnv("FACEBOOK_PAGE_ID");
  const token = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");

  const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
    method: "POST",
    body: new URLSearchParams({ url: imageUrl, caption: message, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Facebook photo post failed: ${JSON.stringify(data)}`);
  return data;
}

// 1枚だけをInstagramに投稿する（カルーセルはmedia_type=CAROUSELに2枚以上必要なため、
// 単一画像はis_carousel_itemなしの通常投稿フローを使う）
export async function postSingleToInstagram(imageUrl: string, caption: string): Promise<{ id: string }> {
  const igId = requireEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID");
  const token = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");

  const createRes = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: "POST",
    body: new URLSearchParams({ image_url: imageUrl, caption, access_token: token }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Instagram media create failed: ${JSON.stringify(createData)}`);

  await waitForInstagramContainerReady(createData.id, token);

  const publishRes = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: createData.id, access_token: token }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(`Instagram publish failed: ${JSON.stringify(publishData)}`);
  return publishData;
}

// 放送室の新エピソード告知（表紙カード1枚のみ）をFacebook/Instagramに同時投稿する
export async function postPodcastEpisodeToSocial(params: {
  imageUrl: string;
  caption: string;
}): Promise<{ facebook: { id: string } | null; instagram: { id: string } | null; errors: string[] }> {
  const errors: string[] = [];

  const [facebookResult, instagramResult] = await Promise.allSettled([
    postSingleToFacebookPage(params.caption, params.imageUrl),
    postSingleToInstagram(params.imageUrl, params.caption),
  ]);

  const facebook = facebookResult.status === "fulfilled" ? facebookResult.value : null;
  if (facebookResult.status === "rejected") errors.push(`Facebook: ${facebookResult.reason}`);

  const instagram = instagramResult.status === "fulfilled" ? instagramResult.value : null;
  if (instagramResult.status === "rejected") errors.push(`Instagram: ${instagramResult.reason}`);

  return { facebook, instagram, errors };
}

// 記事公開時のFacebook/Instagram同時投稿（表紙＋3行まとめの2枚組）
export async function postArticleToSocial(params: {
  imageUrls: string[];
  summary: string;
  articleUrl: string;
}): Promise<{ facebook: { id: string } | null; instagram: { id: string } | null; errors: string[] }> {
  const errors: string[] = [];
  const caption = `${params.summary}\n\n詳しくは以下のリンクまたはプロフィール欄のリンクから\n${params.articleUrl}`;

  // 直列だとInstagramのカルーセル投稿（複数ステップ）が後回しになり、
  // cron側のmaxDuration打ち切りでFacebookだけ成功する事故が起きたため並列化
  const [facebookResult, instagramResult] = await Promise.allSettled([
    postCarouselToFacebookPage(caption, params.imageUrls),
    postCarouselToInstagram(params.imageUrls, caption),
  ]);

  const facebook = facebookResult.status === "fulfilled" ? facebookResult.value : null;
  if (facebookResult.status === "rejected") errors.push(`Facebook: ${facebookResult.reason}`);

  const instagram = instagramResult.status === "fulfilled" ? instagramResult.value : null;
  if (instagramResult.status === "rejected") errors.push(`Instagram: ${instagramResult.reason}`);

  return { facebook, instagram, errors };
}
