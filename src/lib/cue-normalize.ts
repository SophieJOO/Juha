const ASCII_PUNCTUATION = /[.,!?;:'"()[\]{}<>~`@#$%^&*_+=\\/|-]/g;
const CJK_PUNCTUATION = /[，。！？；：「」『』（）［］｛｝《》〈〉、]/g;
const SPACES = /[\s\u00A0\u3000]/g;

export function normalizeCueText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(SPACES, "")
    .replace(ASCII_PUNCTUATION, "")
    .replace(CJK_PUNCTUATION, "")
    .trim();
}

export function assertCueText(input: string): string {
  const normalizedText = normalizeCueText(input);

  if (!normalizedText) {
    throw new Error("그때 보인 것을 한 줄 적어주세요.");
  }

  return normalizedText;
}

export function looksLikeMindReading(input: string): boolean {
  const normalizedInput = input.normalize("NFKC").toLowerCase();
  const patterns = [
    "기분 나빠",
    "기분나빠",
    "싫어했다",
    "싫어한",
    "싫어하는",
    "싫어 보",
    "화난",
    "화가 난",
    "짜증",
    "무시",
    "피했다",
    "피한",
    "얄밉",
    "일부러",
    "삐졌",
    "서운",
    "분위기가 이상",
  ];

  return patterns.some((pattern) => normalizedInput.includes(pattern));
}
