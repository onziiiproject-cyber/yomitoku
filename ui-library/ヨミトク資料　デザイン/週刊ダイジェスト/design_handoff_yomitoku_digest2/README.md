# Handoff: ヨミトク 週刊ダイジェスト（表紙 + 中身）

## Overview
週刊で介護保険の最新情報をまとめて通知するデジェストの2画面（表紙カード / 中身の通知一覧）。ChatGPTで生成した画像を元に、Claude Codeでの実装用としてHTMLで再現したデザインリファレンスです。

## About the Design Files
このバンドル内のファイルは **HTMLで作成したデザインリファレンス**（プロトタイプ）であり、そのままプロダクションコードとして流用するものではありません。実装時は、対象プロジェクトの既存の環境（React / Vue / SwiftUI / ネイティブなど）や既存のコンポーネント・スタイルパターンに合わせてこのデザインを再現してください。まだ環境が定まっていない場合は、プロジェクトに最も適したフレームワークを選定した上で実装してください。

## Fidelity
高忠実度 (hifi) — 元のChatGPT生成画像を可能な限り忠実に再現した見た目のモックです。色・タイポグラフィ・レイアウト・余白は本番実装でそのまま再現してください。

## Screens / Views

### Screen 1: 週刊ダイジェスト表紙カード（Yomitoku Digest Card.dc.html）
- Purpose: メール/LP/SNS等に貼る「今週の介護保険最新情報まとめ」の告知カード（表紙）。ユーザーはこのカードを見て、対象期間・件数を把握し、詳細（原文）へ遷移する導線の入り口として使う想定。
- Layout:
  - 全体キャンバス: 1600×900px、背景 #fbfbfa（淡いオフホワイト、余白）
  - 中央に白カード: 幅1520px、高さ820px、border-radius 32px、box-shadow (0 20px 60px rgba(20,40,38,0.08))
  - カード内パディング: 上下56px / 左右64px
  - カード内は縦方向 flex（justify-content: space-between）で「上部コンテンツ群」「下部注記」の2ブロックに分割
  - 左側にテキストコンテンツ（最大幅900px）、右側にイラスト画像（クリップボード + 虫眼鏡）を絶対配置

- Components:
  1. ロゴ行（上部）
     - Y字型アイコン（56×56、色 #178C7E）+ 下線2本
     - ロゴ文字「ヨミトク」: 32px, font-weight 800, color #1a1a1a
     - サブ文字「介護保険最新情報」: 15px, font-weight 600, color #3a3a3a, letter-spacing 0.15em
  2. メイン見出し（2行）
     - 1行目「介護保険最新情報」: 64px, font-weight 800, color #1a1a1a
     - 2行目「週刊ダイジェスト」: 64px, font-weight 800, color #178C7E（アクセントカラー）、line-height 1.25
  3. 対象期間ピル
     - 角丸pill（border-radius 999px）、border 2px solid #178C7E、padding 14px 28px
     - 左にカレンダーアイコン（24×24, stroke #178C7E）、テキスト「対象期間：令和8年6月1日〜6月15日」: 24px, font-weight 700, color #178C7E
  4. 件数バナー
     - 背景 #e8f4f2、border-radius 20px、padding 24px 32px
     - 左に丸アイコン（56×56, 背景 #178C7E, 白の書類アイコン）
     - テキスト「今回は5件の通知をまとめました」: 26px, font-weight 700, color #1a1a1a、「5件」部分のみ color #178C7E, font-size 30px で強調
  5. フッター注記（カード下部）
     - 左に丸い「i」アイコン（22×22, border 2px solid #178C7E, color #178C7E）
     - テキスト（2行）: 「※ 厚生労働省「介護保険最新情報」ページをもとにした自動要約です。」/「正式な内容は原文でご確認ください。」、font-size 15px, color #666666, line-height 1.7
  6. 右側イラスト画像
     - assets/illustration.png を使用（クリップボード・チェックリスト・虫眼鏡のフラットイラスト、背景円とドットパターン込み）
     - サイズ: 560×560px、右端に配置、object-fit: contain

### Screen 2: 通知一覧（中身）（Yomitoku Digest Content.dc.html）
- Purpose: ダイジェストの本文ページ。今週分の通知を1件ずつカード形式で並べ、要点（タグ・タイトル・重要度バッジ・本文2行・vol番号・日付・資料PDFリンク）を一覧できるようにする。複数ページに分割される想定で、タイトルに「(1/2)」等のページ番号が入る。
- Layout:
  - 全体キャンバス: 1680×945px、背景 #fbfbfa
  - 中央に白カード: 幅1600px、高さ865px、border-radius 28px、box-shadow (0 20px 60px rgba(20,40,38,0.08))
  - カード内パディング: 上下40px / 左右48px、縦方向 flex, gap 24px
  - ヘッダー行 → 通知アイテム×3（縦積み）→ フッター注記、の縦積み構成

- Components:
  1. ヘッダー行
     - 左: 丸いティール背景アイコン（64×64, 背景 #178C7E, 白のメガホンアイコン）+ タイトル「今週の通知一覧（1/2）」38px, font-weight 800, color #1a1a1a
     - 右: ロゴ（Y字アイコン40×40 + 「ヨミトク」22px/800 + 「介護保険最新情報」12px/600）
  2. 通知アイテムカード（×3、繰り返しコンポーネント）
     - 外枠: border 1.5px solid #e3e8e7, border-radius 20px, padding 26px 32px, 横並びflex (gap 28px)
     - 左カラム（幅150px、縦積み・中央揃え）:
       - アイコンボックス: 96×96px, border-radius 20px, background #e8f4f2、中央に44×44のティール線画アイコン（案件ごとに異なる: 調査=クリップボード+棒グラフ、安全=盾+！、制度改正=天秤）
       - タグpill: background #e8f4f2, color #178C7E, font-weight 700, font-size 15px, border-radius 999px, padding 8px 18px（例: 「調査・データ提供依頼」「安全・事故防止」「制度改正」）
     - 右カラム（縦積み、justify-content: space-between）:
       - タイトル行: タイトル文言 26px/800/#1a1a1a + 重要度バッジ（「重要」background #fde7e7 color #d64545 / 「注目」background #fdf0dc color #c9822a、font-weight 700, font-size 16px, border-radius 8px, padding 4px 14px）
       - 本文2行: font-size 18px, color #4a4a4a, line-height 1.7
       - フッター行（横並び space-between）: 左に vol番号（ドキュメントアイコン18×18 + テキスト） と 日付（カレンダーアイコン18×18 + テキスト）、色 #178C7E, font-size 17px/600、gap 28px。右に「資料PDFを見る →」リンク（color #178C7E, font-size 18px/700, underline）
  3. フッター注記
     - background #f4f7f6, border-radius 16px, padding 16px 24px
     - 左に丸い「i」アイコン（22×22, border 2px solid #178C7E）+ テキスト「※ 厚生労働省「介護保険最新情報」ページをもとにした自動要約です。正式な内容は原文でご確認ください。」font-size 15px, color #666666

- 掲載データ（このモックのサンプル値。実装時はCMS/APIからの動的データに置換）:
  1. vol.1507 / 令和8年6月1日 / タグ:調査・データ提供依頼 / バッジ:重要 / 「令和8年度 介護従事者処遇状況等調査への協力依頼（7月実施）」
  2. vol.1508 / 令和8年6月3日 / タグ:安全・事故防止 / バッジ:重要 / 「訪問系サービス従事者の安全確保の徹底について」
  3. vol.1509 / 令和8年6月3日 / タグ:制度改正 / バッジ:注目 / 「職員確保のための補助金、都道府県から交付可能に」

- Colors (design tokens, 両画面共通):
  - Primary accent (teal): #178C7E
  - Teal tint (banner/tag/icon bg): #e8f4f2
  - Teal tint light (illustration bg circle): #e6f2f0 / #eef6f4
  - Badge 重要: background #fde7e7, text #d64545
  - Badge 注目: background #fdf0dc, text #c9822a
  - Border (item card): #e3e8e7
  - Footer note bg: #f4f7f6
  - Text primary: #1a1a1a / secondary: #3a3a3a / body: #4a4a4a / muted: #666666
  - Page background: #fbfbfa / White: #ffffff

- Typography (両画面共通):
  - フォント: システムの日本語ゴシック（Hiragino Kaku Gothic ProN / Hiragino Sans / Yu Gothic 相当）。本番実装ではプロジェクトの標準日本語フォントスタックに置き換えてください。
  - Weight: 見出し・強調は800、ラベル・バナー・リンクは700、サブテキストは600、本文は通常〜400

- Border radius: カード28-32px、ピル/タグ999px、バナー/アイコンボックス16-20px、アイコン丸は50%
- Shadows: カードのみ 0 20px 60px rgba(20,40,38,0.08)（ソフトな浮遊感）

## Interactions & Behavior
静的なビジュアル（告知画像/ページ）としての用途を想定。
- Screen 2の「資料PDFを見る →」は各通知の詳細PDFへのリンク（クリックで新規タブ/別画面遷移を想定）。
- Screen 2はページネーション想定（タイトルの「(1/2)」）。通知件数が多い場合は複数ページに分割し、次ページへのナビゲーション（矢印やページ番号）を追加する想定。本モックには未実装のため、実装時に追加要否を確認してください。
- Screen 1・2ともホバー/フォーカス状態は元デザインに定義なし。実装先のインタラクションパターンに合わせて追加してください。

## State Management
状態なし（静的コンテンツ）。実データ連携する場合の想定変数:
- Screen 1: periodStart / periodEnd（対象期間の開始・終了日）, notificationCount（まとめた通知件数）
- Screen 2: notices（配列。各要素: icon種別, tag, title, badgeLabel, badgeColor, description(1-2行), vol, date, pdfUrl）, currentPage / totalPages（ページネーション用）

## Design Tokens
上記 Colors / Typography / Border radius / Shadows を参照。

## Assets
- Screen 1の右側イラストは実画像（assets/illustration.png、ユーザー提供のイラスト素材）をそのまま使用しています。ロゴの「Y」アイコンのみ基本図形（線・多角形）で簡易再現したもので、本番実装ではブランドの正式ロゴデータに差し替えてください。
- Screen 2のアイコン（クリップボード+グラフ、盾+！、天秤）は簡易線画SVGです。本番ではアイコンライブラリまたは正式素材に差し替え可能です。
- 元画像ファイル:
  - reference-image.png … Screen 1（表紙）の元画像
  - reference-image-content.png … Screen 2（中身/通知一覧）の元画像

## Files
- Yomitoku Digest Card.dc.html — Screen 1（表紙）デザインリファレンス本体（ブラウザで直接開けます）
- Yomitoku Digest Content.dc.html — Screen 2（中身/通知一覧）デザインリファレンス本体（ブラウザで直接開けます）
- assets/illustration.png — Screen 1で使用しているイラスト画像
- reference-image.png / reference-image-content.png — 元のChatGPT生成画像（参考用）
