const GRAPH_API = "https://graph.facebook.com/v23.0";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
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

  const publishRes = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: createData.id, access_token: token }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(`Instagram publish failed: ${JSON.stringify(publishData)}`);
  return publishData;
}

// 記事公開時のFacebook/Instagram同時投稿（表紙＋3行まとめの2枚組）
export async function postArticleToSocial(params: {
  imageUrls: string[];
  summary: string;
  articleUrl: string;
}): Promise<{ facebook: { id: string } | null; instagram: { id: string } | null; errors: string[] }> {
  const errors: string[] = [];
  const caption = `${params.summary}\n\n詳しくは以下のリンクまたはプロフィール欄のリンクから\n${params.articleUrl}`;

  let facebook: { id: string } | null = null;
  try {
    facebook = await postCarouselToFacebookPage(caption, params.imageUrls);
  } catch (e) {
    errors.push(`Facebook: ${e}`);
  }

  let instagram: { id: string } | null = null;
  try {
    instagram = await postCarouselToInstagram(params.imageUrls, caption);
  } catch (e) {
    errors.push(`Instagram: ${e}`);
  }

  return { facebook, instagram, errors };
}
