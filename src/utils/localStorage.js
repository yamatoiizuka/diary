/**
 * LocalStorageのキー定数
 */
const STORAGE_KEYS = {
  IS_PLAYING: "diary_isPlaying",
  SHOW_TEXT: "diary_showText",
};

/**
 * LocalStorageから値を取得
 * @param {string} key - 取得するキー
 * @param {*} defaultValue - デフォルト値
 * @returns {*} 保存された値またはデフォルト値
 */
export const getStorageValue = (key, defaultValue) => {
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to get ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * LocalStorageに値を保存
 * @param {string} key - 保存するキー
 * @param {*} value - 保存する値
 */
export const setStorageValue = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to set ${key} to localStorage:`, error);
  }
};

/**
 * 再生状態を取得
 * @returns {boolean}
 */
export const getIsPlaying = () => getStorageValue(STORAGE_KEYS.IS_PLAYING, true);

/**
 * 再生状態を保存
 * @param {boolean} value
 */
export const setIsPlaying = (value) =>
  setStorageValue(STORAGE_KEYS.IS_PLAYING, value);

/**
 * テキスト表示状態を取得
 * @returns {boolean}
 */
export const getShowText = () => getStorageValue(STORAGE_KEYS.SHOW_TEXT, true);

/**
 * テキスト表示状態を保存
 * @param {boolean} value
 */
export const setShowText = (value) => setStorageValue(STORAGE_KEYS.SHOW_TEXT, value);
