# TODO

## Feature
- expected / actual price に対してマージンを指定できるようにする→通貨ごと？
  - マージンに満たない場合はリトライ
  - エントリ終了するまでリトライする
- リトライの挙動
  - 全体の同時実行数はあくまで1
  - 再実行可能な時刻を設定してキューに並び直す
- MultiLogger の Slack と Console の役割を分離したい
  - Console 部分は標準 Console の方がよさそう
- マーチン対応

## Bug
- Logger でなく Console になっちゃってる箇所がある

# Done

## Feature
- AssetGroups をキャッシュする→1~5分くらい？
- エントリー終わってる AssetOption の場合は次のやつに行く

## Bug
- Throttling 2 なのに2個目を実行しようとしたら蹴られる
  - 60 秒じゃなくて 60000 秒になってた…
- 各 AssetOption ごとにスロットリングする
  - cooldown 終わるまでその AssetOption は entry できないようにした
