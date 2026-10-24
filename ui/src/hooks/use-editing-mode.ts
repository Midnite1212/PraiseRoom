import { useEffect } from 'react';

// Marks `<html>` with `editing` while an editor is open, so the app shell hides the phone tab dock.
export const useEditingMode = () => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('editing');
    return () => root.classList.remove('editing');
  }, []);
};
