# BR! 統合メンテナンスツール (Integrated Maintenance Tool)

このプロジェクトは、BizRobo! の運用・メンテナンス作業を支援するために開発された、多機能デスクトップアプリケーションです。フロントエンドに **Angular 14**、バックエンドに **Electron** を採用しています。

## ✨ 機能概要

このアプリケーションは、以下の 3 つの主要機能を提供します。

1.  **疎通チェッカー (Connection Checker)**

    - サーバー間のネットワーク層（Ping）およびトランスポート層（TCP ポート）の接続性を、GUI から迅速に確認できます。
    - チェックモード（DAS, DS, MC など）を選択するだけで、必要な接続項目を自動でテストします。
    - 実行結果は色分けされたログで表示され、ファイルへの保存も可能です。

2.  **バックアップ編集 (Backup Editor)**

    - BizRobo! の ZIP 形式バックアップファイル内のクラスター情報（Production / Non Production）を、ワンクリックで切り替えることができます。
    - `global.xml` および各 `project.xml` を自動で検索・編集し、新しい ZIP ファイルを生成します。

3.  **ライセンス認証 (License Activator)**
    - Management Console (MC) の動作要件を満たすブラウザがインストールされていない環境でも、ライセンス認証作業を補助します。
    - 指定した MC の URL を、独立した新しいウィンドウで安全に開きます。

## 🏛️ アーキテクチャと設計思想

- **統合プラットフォーム:** 従来は個別のツールだった 3 つの機能を、単一の Electron アプリケーションに統合。統一された UI/UX を提供します。
- **モダンな UI:** フロントエンドは **Angular 14** と **Angular Material** で構築。開閉式サイドメニューを持つ、直感的でモダンなレイアウトを採用しています。
- **フィーチャーモジュールと遅延読み込み:** 各機能は Angular のフィーチャーモジュールとして独立しており、遅延読み込み（Lazy Loading）されます。これにより、アプリケーションの起動速度が最適化され、機能ごとの関心事が明確に分離されています。
- **堅牢なバックエンド:** バックエンドのロジックは、機能ごとにモジュール化された TypeScript (`*.handler.ts`) で記述されており、メンテナンス性と拡張性に優れています。
- **クロスプラットフォーム開発:**
  - **Angular (UI):** 開発環境を `DevContainer` で Docker 化。Node.js や Angular CLI のバージョン、VS Code 拡張機能が統一され、誰でも同じ環境を再現できます。
  - **Electron (Backend):** ホストマシン上で直接実行。OS ネイティブの機能（ダイアログ、ウィンドウ管理など）を最大限に活用します。

## 🚀 開発環境セットアップ

開発を始めるために、お使いの PC（ホストマシン）に以下のソフトウェアをインストールしてください。

1.  **Git:** [公式サイト](https://git-scm.com/)
2.  **Docker Desktop:** [公式サイト](https://www.docker.com/products/docker-desktop/) （起動しておく）
3.  **Visual Studio Code (VS Code):** [公式サイト](https://code.visualstudio.com/)
4.  **VS Code 拡張機能 "Dev Containers":** `ms-vscode-remote.remote-containers`
5.  **Node.js (LTS 版):** [公式サイト](https://nodejs.org/ja) （Electron をホストマシンで動かすため）

### **セットアップ手順**

1.  **プロジェクトの取得と起動**

    ```bash
    # リポジトリをクローン
    git clone <リポジトリのURL>
    cd <プロジェクトフォルダ名>

    # VS Codeでプロジェクトを開く
    code .
    ```

    VS Code を開くと右下に表示される **「Reopen in Container」** をクリックし、DevContainer をビルド・起動します。

2.  **依存パッケージのインストール**
    開発には **2 つのターミナル** が必要です。

    - **(A) Angular の依存関係 (DevContainer 内)**
      VS Code に統合されているターミナル（`Ctrl + @` or `Ctrl + Shift + @`）を開き、実行します。

      ```bash
      # DevContainer内のターミナル
      cd /workspaces/client
      npm install
      ```

    - **(B) Electron の依存関係 (ホストマシン上)**
      **VS Code とは別に、お使いの PC のターミナル**（PowerShell, コマンドプロンプト等）を起動し、プロジェクトフォルダに移動して実行します。
      ```bash
      # ホストマシンのターミナル
      cd server
      npm install
      ```

これでセットアップは完了です！

## 🛠️ 開発ワークフロー

アプリケーションの起動と開発には、**2 つのターミナルを同時に使用します。**

- **ターミナル 1 (DevContainer 内): Angular (UI) を起動**
  VS Code のターミナルで実行します。

  ```bash
  # DevContainer内のターミナル
  cd /workspaces/client
  npm start
  ```

  `client` フォルダ内の UI 関連コードを変更すると、Electron ウィンドウが自動でリロードされます。

- **ターミナル 2 (ホストマシン上): Electron (Backend) を起動 & ウォッチ**
  ホストマシンのターミナルで実行します。ファイルの変更を監視し、自動で再ビルド・再起動します。
  ```bash
  # ホストマシンのターミナル
  cd server
  # 以前は watch と start が別でしたが、npm-run-all と electron-watch で自動化できます
  # (package.jsonの修正を推奨しますが、既存のままでも可)
  # 既存のコマンドの場合:
  # ターミナルを2つ使い、片方で npm run watch、もう片方で npm start
  npm run watch
  ```
  上記を実行した状態で、**別のホストマシンターミナル**を開き、以下を実行します。
  ```bash
  # 別のホストマシンのターミナル
  cd server
  npm start
  ```
  `server` フォルダ内のバックエンドコードを変更すると、`watch` が自動で再ビルドします。アプリを再起動 (`npm start`) すると変更が反映されます。

## 📂 プロジェクト構成

```
.
├── .devcontainer/  # DevContainer設定 (Angular開発環境)
├── client/         # ■ フロントエンド (Angular)
│   └── src/
│       ├── app/
│       │   ├── features/               # ★ 各機能のフィーチャーモジュール
│       │   │   ├── connection-checker/ # 疎通チェッカー機能
│       │   │   ├── backup-editor/      # バックアップ編集機能
│       │   │   └── license-activator/  # ライセンス認証機能
│       │   ├── shared/                 # ★ 共通コンポーネント・サービス
│       │   │   ├── components/
│       │   │   │   └── layout/         # 全体のレイアウト
│       │   │   └── services/
│       │   │       └── layout.service.ts # レイアウトの状態管理
│       │   ├── app-routing.module.ts
│       │   └── app.module.ts
│       └── typings.d.ts              # Electron APIの型定義
└── server/         # ■ バックエンド (Electron)
    └── src/
        ├── features/                 # ★ 各機能のバックエンドロジック
        │   ├── backup-editor.handler.ts
        │   ├── connection-checker.handler.ts
        │   └── license-activator.handler.ts
        ├── main.ts                   # Electronメインプロセス (司令塔)
        ├── preload.ts                # フロントとバックの安全な橋渡し役
        └── shared-channels.ts        # IPCチャンネル名の共有ファイル
```

## 📦 本番ビルドとパッケージ化

アプリケーションを配布可能な形式（`.exe`など）にビルドします。

1.  **Angular アプリの本番ビルド (DevContainer 内)**

    ```bash
    # DevContainer内のターミナル
    cd /workspaces/client
    npm run build
    ```

    これにより、`client/dist/` に最適化されたフロントエンドファイルが生成されます。

2.  **Electron アプリのパッケージ化 (ホストマシン上)**
    ```bash
    # ホストマシンのターミナル
    cd server
    npm run package
    ```
    ビルドが成功すると、`server/release` フォルダに実行可能なアプリケーションファイルが生成されます。
