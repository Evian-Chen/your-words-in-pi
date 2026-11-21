# Your Words in π

輸入一句話，看每個字散落在圓周率小數點後的哪些位置。

每個字轉成「碼位的十進位數字（至少 5 位）」，在 π 的前 300 萬位找第一次出現的位置；動畫呈現 π 的數字 → 二進位 → 該字。

## 使用

```
npm install
npm run build      # 建置前端
npm start          # http://localhost:8787
npm run dev        # 開發模式（前端 5173，後端 8787）
npm test
```

## 重新產生 π 索引

```
python scripts/gen-pi.py 3000000 data/pi-digits.txt   # 約 10 分鐘（mpmath）
npm run index                                          # 產生 data/pi-index.bin
```

BMP 內所有字（含中英文）都能在 300 萬位內找到；約 4.5% 的 emoji 會顯示「未在前 N 位出現」。要涵蓋全部 emoji，用 y-cruncher 或 gmpy2 產生 3 億位 π 再執行 `npm run index`。
