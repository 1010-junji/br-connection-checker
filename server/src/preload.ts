import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { channels } from './shared-channels'; // 新しいファイルからインポート

contextBridge.exposeInMainWorld('electronAPI', {
  // チェック実行を依頼する (双方向)
  runCheck: (mode: string, params: any) => ipcRenderer.invoke(channels.RUN_CHECK, mode, params),

  // ログの保存を依頼する (双方向)
  saveLog: (logContent: string) => ipcRenderer.invoke(channels.SAVE_LOG, logContent),

  // 進捗イベントのリスナーを登録する (Electronからの受信)
  onCheckProgress: (callback: (event: IpcRendererEvent, log: string) => void) => {
    ipcRenderer.on(channels.CHECK_PROGRESS, callback);
    // クリーンアップ関数を返す
    return () => ipcRenderer.removeAllListeners(channels.CHECK_PROGRESS);
  },
});