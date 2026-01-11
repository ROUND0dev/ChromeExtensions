// 保存ボタンが押された時の処理
document.getElementById('save').addEventListener('click', () => {
  const listId = document.getElementById('listId').value;

  chrome.storage.sync.set({ targetListId: listId }, () => {
    const status = document.getElementById('status');
    status.textContent = '保存が完了しました！';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

// ページを開いた時に、保存されている値を表示する
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['targetListId'], (result) => {
    if (result.targetListId) {
      document.getElementById('listId').value = result.targetListId;
      document.getElementById('curListId').textContent = result.targetListId;
    }
  });
});