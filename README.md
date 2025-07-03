# コンポーネント間通信 疎通チェッカー (Connection Checker)

このプロジェクトは、フロントエンドに Angular、バックエンドに Electron を使用した、サーバー/モジュール間の通信疎通確認ツールです。
特定のノード間のネットワーク層（Ping）およびトランスポート層（TCP ポート）の接続性を、使いやすい GUI から迅速に確認することを目的としています。

## 1. アーキテクチャと設計思想

このプロジェクトは、開発の安定性とクロスプラットフォーム性を重視し、以下のアーキテクチャを採用しています。

- **Angular on DevContainer:** フロントエンド(UI)は Docker コンテナ内で開発します。Node.js や Angular CLI のバージョン、VS Code 拡張機能が完全に統一され、誰の PC でも`npm install`だけで同じ開発環境を再現できます。

- **Electron on Host Machine:** Electron はホストマシン(あなたの PC)で直接実行します。これにより、OS 固有の GUI 機能を最大限に活用し、安定した動作を実現します。

- **Node.js Native Networking:** 疎通確認のコアロジックは、**PowerShell などの外部スクリプトに依存せず、すべて Node.js の標準モジュール (`net`) と信頼性の高いライブラリ (`ping`) で実装**しています。この選択により、以下の大きなメリットを享受できます。

  - **管理者権限不要:** アプリケーションの実行に管理者権限（UAC 昇格）は必要ありません。
  - **クロスプラットフォーム:** Windows 以外の OS でも動作するポータビリティを持ちます。
  - **高い安定性と速度:** 外部プロセス起動のオーバーヘッドや、環境依存の文字コード問題、権限問題を完全に排除し、安定かつ高速に動作します。

- **Build with `esbuild`:** `server`サイドの TypeScript ビルドには、高速なバンドラ`esbuild`を採用しています。`import`構文を維持したまま、スクリプト間の依存関係をビルド時に解決し、実行時のパス問題を未然に防ぎます。

## 2. 開発環境セットアップ

開発を始めるために、以下の手順を一度だけ実行してください。

### Step 0: 事前準備

お使いの PC（ホストマシン）に以下のソフトウェアがインストールされていることを確認してください。

1.  **Git:** [公式サイト](https://git-scm.com/)からダウンロードしてインストール。
2.  **Docker Desktop:** [公式サイト](https://www.docker.com/products/docker-desktop/)からダウンロードしてインストール。起動しておいてください。
3.  **Visual Studio Code (VS Code):** [公式サイト](https://code.visualstudio.com/)からダウンロードしてインストール。
4.  **VS Code 拡張機能 "Dev Containers":** `ms-vscode-remote.remote-containers` をインストール。
5.  **Node.js (LTS 版):** [公式サイト](https://nodejs.org/ja)からダウンロードしてインストール。Electron をホストマシンで動かすために必要です。

### Step 1: プロジェクトの取得と起動

1.  このリポジトリをローカルマシンにクローンします。
    ```bash
    git clone <リポジトリのURL>
    cd <プロジェクトフォルダ名>
    ```
2.  プロジェクトフォルダを VS Code で開きます (`code .`)。
3.  右下に表示される**「Reopen in Container」**をクリックし、DevContainer をビルド・起動します。

### Step 2: 依存パッケージのインストール

環境のセットアップは、以下の 2 つのパートに分かれます。

- **(A) Angular の依存関係 (DevContainer 内)**
  VS Code に統合されているターミナル（`Ctrl + @`）を開き、以下のコマンドを実行します。

  ```bash
  # DevContainer内のターミナルで実行
  cd /workspaces/client
  npm install
  ```

- **(B) Electron の依存関係 (ホストマシン上)**
  **VS Code とは別に、お使いの PC のターミナル**（PowerShell, コマンドプロンプト等）を起動し、プロジェクトフォルダに移動して以下のコマンドを実行します。
  ```bash
  # ホストマシンのターミナルで実行
  cd server
  npm install
  ```

これで全てのセットアップは完了です！

## 3. 開発ワークフロー

アプリケーションを起動し、開発を始めるための手順です。**2 つのターミナルを同時に使用します。**

- **ターミナル 1 (DevContainer 内): Angular を起動**
  VS Code のターミナルで実行します。

  ```bash
  cd /workspaces/client
  npm start
  ```

  UI コード (`client`フォルダ内) を変更すると、Electron ウィンドウが自動でリロードされます。

- **ターミナル 2 (ホストマシン上): Electron を起動 & ウォッチ**
  ホストマシンのターミナルで実行します。`watch`コマンドでファイルの変更を監視し、自動で再ビルドします。
  ```bash
  cd server
  npm run watch
  ```
  この`watch`コマンドを実行した状態で、**別のホストマシンターミナル**を開き、以下を実行してアプリを起動します。
  ```bash
  cd server
  npm start
  ```
  バックエンドのコード (`server`フォルダ内) を変更すると、`watch`が自動で再ビルドします。アプリを再起動 (`npm start`) すると変更が反映されます。

## 4. プロジェクト構成

```
.
├── .devcontainer/  # DevContainer設定 (Angular開発環境)
├── client/         # ★ フロントエンド (Angular)
│   └── src/
├── server/         # ★ バックエンド (Electron)
│   └── src/
│       ├── main.ts         # Electronメインプロセス (疎通確認ロジックを含む)
│       ├── preload.ts      # フロントとバックの安全な橋渡し役
│       └── shared-channels.ts # IPCチャンネル名の共有ファイル
└── README.md       # (このファイル)
```

**注意:** `server/scripts`フォルダは、Node.js ネイティブ実装への移行に伴い不要になりました。

## 5. 本番ビルドとパッケージ化

アプリケーションを配布可能な形式（`.exe`, `.dmg`など）にビルドする手順です。

1.  **Angular アプリの本番ビルド (DevContainer 内)**

    ```bash
    # DevContainer内のターミナルで実行
    cd /workspaces/client
    npm run build
    ```

2.  **Electron アプリのパッケージ化 (ホストマシン上)**
    ```bash
    # ホストマシンのターミナルで実行
    cd server
    npm run package
    ```
    ビルドが成功すると、`server/release` フォルダに実行可能なアプリケーションファイルが生成されます。
