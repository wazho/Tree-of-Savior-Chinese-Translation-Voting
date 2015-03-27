## 救世主之樹 國際繁中版群眾翻譯系統

### Tree of Savior - Crowdsourcing Translation

![cover](readme/cover.png)

![main](readme/1.png)

---

### 程式流程 Workflow

1. #### 原文資料抓取（Base data parsing）

    *zh*: 系統自動至官方 GitHub 下載當前的最新語言文件包。

    *en*: Parsing the `.tsv` data from ToS official GitHub.
2. #### 多語言合併（Merging multi-languages）

    *zh*: 將相同檔名的韓文、英文做合併處理、資料建檔。

    *en*: Merging the same file name .tsv into JSON, and write them in `server/generation_json`.
3. #### 群眾資料初始化（Initailize crowdsourcing data）

    *zh*: 依照不同語言文件編號，產生相對應的群眾資料集。

    *en*: Then initlizing the crowd's translations in `server/crowdsourcing`.
4. #### 玩家群眾翻譯（Crowdsourced translation）

    *zh*: 玩家登入 Facebook 後在首頁隨機取出幾筆，進而提交翻譯版本。

    *en*: At the web app, people can read conversations randomly. They could submit translation version.
5. #### 翻譯版本排行（Traslations ranking）
    *zh*: 玩家可以針對不同對話內容的各個翻譯版本中挑選幾筆給予贊同，然後依照贊同數量決定該版本的排行順序。

    *en*: Others people could choose translation version that they agree. System ranks the counts of agreement.

---

### 執行環境 Environment

* Node.js

* 不使用資料庫（Not using database）

---

### 執行方式 Processing


```
1. Clone this repo in `terminal`.

> git clone https://github.com/grass0916/Tree-of-Savior-Chinese-Translation-Voting.git

```

```
2. Please install Node.js in your OS version.

https://nodejs.org/download/
```

```
3. Change the config.js in `server/src/_config.js`.

a. Facebook App ID
b. Domain name & port
c. And else you want.
```

```
4. Run the server in `terminal`.

> cd Tree-of-Savior-Chinese-Translation-Voting/
> node server/app.js
```

```
5. Now, Website is running. Browse it.

http://your-domain-name:your-open-port
```

---

### 畫面截圖 Screenshots

![read_conversation](readme/2.png)

![write_translation](readme/3.png)

---

### 授權 License

The MIT License for code of this project.

About Game screenshot images all rights reserved by IMC Games & Nexon.


![footer](readme/4.png)