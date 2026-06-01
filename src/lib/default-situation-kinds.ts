export const DEFAULT_SITUATION_KINDS = [
  {
    code: "rock_paper_scissors_turn",
    label: "가위바위보/순서",
    userFacingLabel: "가위바위보/순서",
    expertCheckDefault: false,
  },
  {
    code: "rule_changed",
    label: "룰이 달라졌어요",
    userFacingLabel: "룰이 달라졌어요",
    expertCheckDefault: false,
  },
  {
    code: "upset_help",
    label: "속상해서 도움을 찾았어요",
    userFacingLabel: "속상해서 도움을 찾았어요",
    expertCheckDefault: false,
  },
  {
    code: "whisper_private_talk",
    label: "귓속말/몰래 말하기",
    userFacingLabel: "귓속말/몰래 말하기",
    expertCheckDefault: false,
  },
  {
    code: "hurtful_friend_words",
    label: "친구 말이 얄미웠어요",
    userFacingLabel: "친구 말이 얄미웠어요",
    expertCheckDefault: false,
  },
  {
    code: "peer_joined_my_play",
    label: "내 놀이에 친구가 왔어요",
    userFacingLabel: "내 놀이에 친구가 왔어요",
    expertCheckDefault: false,
  },
  {
    code: "group_play",
    label: "단체놀이 참여",
    userFacingLabel: "단체놀이 참여",
    expertCheckDefault: true,
  },
  {
    code: "lining_up",
    label: "줄서기",
    userFacingLabel: "줄서기",
    expertCheckDefault: false,
  },
  {
    code: "seat_yielding",
    label: "자리 양보",
    userFacingLabel: "자리 양보",
    expertCheckDefault: false,
  },
  {
    code: "borrowing_items",
    label: "물건 빌리기",
    userFacingLabel: "물건 빌리기",
    expertCheckDefault: false,
  },
  {
    code: "other",
    label: "기타",
    userFacingLabel: "기타",
    expertCheckDefault: false,
  },
] as const;
