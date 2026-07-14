# Handoff: ヨミトク 週刊ダイジェスト カード（介護保険最新情報）

## Overview
週刊で介護保険の最新情報をまとめて通知するデジェストカード（サムネイル/OGP的なビジュアル）。ChatGPTで生成した画像を元に、Claude Codeでの実装用としてHTMLで再現したデザインリファレンスです。

## About the Design Files
このバンドル内のファイルは **HTMLで作成したデザインリファレンス**（プロトタイプ）であり、そのままプロダクションコードとして流用するものではありません。実装時は、対象プロジェクトの既存の環境（React / Vue / SwiftUI / ネイティブなど）や既存のコンポーネント・スタイルパターンに合わせてこのデザインを再現してください。まだ環境が定まっていない場合は、プロジェクトに最も適したフレームワークを選定した上で実装してください。

## Fidelity
高忠実度 (hifi) — 元のChatGPT生成画像を可能な限り忠実に再現した見た目のモックです。色・タイポグラフィ・レイアウト・余白は本番実装でそのまま再現してください（イラスト部分の細部は簡略化しています。下記 Assets 参照）。

## Screens / Views

### Screen: 週刊ダイジェストカード
- Purpose: メール/LP/SNS等に貼る「今週の介護保険最新情報まとめ」の告知カード。ユーザーはこのカードを見て、対象期間・件数を把握し、詳細（原文）へ遷移する導線の入り口として使う想定。
- Layout:
  - 全体キャンバス: 1600×900px、背景 #fbfbfa（淡いオフホワイト、余白）
  - 中央に白カード: 幅1520px、高さ820px、border-radius 32px、box-shadow (0 20px 60px rgba(20,40,38,0.08))
  - カード内パディング: 上下56px / 左右64px
  - カード内は縦方向 flex（justify-content: space-between）で「上部コンテンツ群」「下部注記」の2ブロックに分割
  - 左側にテキストコンテンツ（最大幅900px）、右側背景にイラスト（クリップボード + 虫眼鏡）を絶対配置

- Components:
  1. ロゴ行（上部）
     - Y字型アイコン（56×56、色 #178C7E）+ 下線2本
     - ロゴ文字「ヨミトク」: 32px, font-weight 800, color #1a1a1a
     - サブ文字「介護保険最新情報」: 15px, font-weight 600, color #3a3a3a, letter-spacing 0.15em
     - アイコンとテキストの間隔 16px
  2. メイン見出し（2行）
     - 1行目「介護保険最新情報」: 64px, font-weight 800, color #1a1a1a
     - 2行目「週刊ダイジェスト」: 64px, font-weight 800, color #178C7E（アクセントカラー）
     - line-height 1.25
  3. 対象期間ピル
     - 角丸pill（border-radius 999px）、border 2px solid #178C7E、padding 14px 28px、幅はコンテンツに合わせて可変
     - 左にカレンダーアイコン（24×24, stroke #178C7E）
     - テキスト「対象期間：令和8年6月1日〜6月15日」: 24px, font-weight 700, color #178C7E
  4. 件数バナー
     - 背景 #e8f4f2、border-radius 20px、padding 24px 32px
     - 左に丸アイコン（56×56, 背景 #178C7E, 白の書類アイコン）
     - テキスト「今回は5件の通知をまとめました」: 26px, font-weight 700, color #1a1a1a、「5件」部分のみ color #178C7E, font-size 30px で強調
  5. フッター注記（カード下部）
     - 左に丸い「i」アイコン（22×22, border 2px solid #178C7E, color #178C7E）
     - テキスト（2行）: 「※ 厚生労働省「介護保険最新情報」ページをもとにした自動要約です。」/「正式な内容は原文でご確認ください。」
     - font-size 15px, color #666666, line-height 1.7
  6. 右側イラスト（装飾、非インタラクティブ）
     - 背景の大きな円（薄いティール #e6f2f0）と小さい円（#eef6f4）
     - ドットパターン2箇所（グリッド状の小さい丸、色 #178C7E、opacity 0.4〜0.55）
     - クリップボード（白地、ティールの太い枠線 #178C7E、上部にクリップ部分）
     - クリップボード内にチェックリスト5行（緑丸+チェックマーク、右にグレーのバー #dfe6e4）
     - 右下に黒い虫眼鏡アイコン（斜め45度）がクリップボードに重なる
     - 左上にティールの「キラッ」を示す3本の短い線

- Colors (design tokens):
  - Primary accent (teal): #178C7E
  - Teal tint (banner bg): #e8f4f2
  - Teal tint light (illustration bg circle): #e6f2f0 / #eef6f4
  - Text primary: #1a1a1a
  - Text secondary: #3a3a3a
  - Text muted (footnote): #666666
  - Placeholder bar (illustration): #dfe6e4
  - Page background: #fbfbfa
  - White: #ffffff

- Typography:
  - フォント: システムの日本語ゴシック（Hiragino Kaku Gothic ProN / Hiragino Sans / Yu Gothic 相当）。本番実装ではプロジェクトの標準日本語フォントスタックに置き換えてください。
  - サイズ: ロゴ32px / サブ見出し15px / メイン見出し64px / ピル24px / バナー本文26px（強調部30px）/ フッター15px
  - Weight: 見出し・強調は800、ラベル・バナーは700、サブテキストは600、本文は通常

- Border radius: カード32px、ピル999px（完全な丸角）、バナー20px、アイコン丸は50%
- Shadows: カードのみ 0 20px 60px rgba(20,40,38,0.08)（ソフトな浮遊感）

## Interactions & Behavior
静的なビジュアル（告知画像）としての用途を想定。クリック等のインタラクションは元デザインには含まれていない。実装先でリンクカードとして使う場合は、カード全体または「対象期間」「詳細を見る」導線にリンクを付与することを検討。

## State Management
状態なし（静的コンテンツ）。実データ連携する場合の想定変数:
- periodStart / periodEnd（対象期間の開始・終了日）
- notificationCount（まとめた通知件数、現在「5件」）

## Design Tokens
上記 Colors / Typography / Border radius / Shadows を参照。

## Assets
- ロゴの「Y」アイコンおよびクリップボード・虫眼鏡イラストは、元のChatGPT生成画像の見た目を基本図形（円・矩形・線）で簡略再現したものです。本番実装では、ブランドの正式ロゴデータおよびイラストアセット（SVG/画像）に差し替えてください。
- 元画像ファイル: uploads/881C7862-DEA1-4AEC-8D18-84E7B5F65555.PNG（このバンドルに reference-image.png として同梱、参照用）

## Files
- Yomitoku Digest Card.dc.html — デザインリファレンス本体（ブラウザで直接開けます）
- reference-image.png — 元のChatGPT生成画像（参考用）
