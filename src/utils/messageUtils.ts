import { Message } from '../types/chat';

/**
 * 같은 발신자의 연속 메시지인지 체크 (inverted FlatList용)
 * @param currentMessage - 현재 메시지
 * @param prevMessage - 이전 메시지 (화면상 위쪽, 더 최근)
 * @returns 연속 메시지면 true
 */
export const isContinuousMessage = (currentMessage: Message, prevMessage: Message | null): boolean => {
  if (!prevMessage) return false;

  const isSameSender = currentMessage.sender.id === prevMessage.sender.id;
  // inverted에서는 prevMessage가 더 최근 메시지이므로 prevMessage - currentMessage 시간 차이를 계산
  const timeDiff = new Date(prevMessage.created_at).getTime() - new Date(currentMessage.created_at).getTime();
  const isWithinTimeLimit = timeDiff < 60000; // 1분

  return isSameSender && isWithinTimeLimit && isSameDay(currentMessage.created_at, prevMessage.created_at);
};

/**
 * 메시지 시간 표시 여부 결정 (카카오톡 스타일, inverted FlatList용)
 * @param currentMessage - 현재 메시지
 * @param prevMessage - 이전 메시지 (화면상 위쪽, 더 최근)
 * @returns 시간 표시 필요하면 true
 */
export const shouldShowMessageTime = (currentMessage: Message, prevMessage: Message | null): boolean => {
  // 이전 메시지가 없으면 (가장 최근 메시지) 시간 표시
  if (!prevMessage) return true;

  // 이전 메시지가 다른 발신자면 시간 표시
  if (currentMessage.sender.id !== prevMessage.sender.id) return true;

  // 이전 메시지가 다른 날짜면 시간 표시
  if (!isSameDay(currentMessage.created_at, prevMessage.created_at)) return true;

  // 이전 메시지가 다른 시간대(분)면 시간 표시
  const currentTime = new Date(currentMessage.created_at);
  const prevTime = new Date(prevMessage.created_at);
  const currentMinute = currentTime.getHours() * 60 + currentTime.getMinutes();
  const prevMinute = prevTime.getHours() * 60 + prevTime.getMinutes();

  return currentMinute !== prevMinute;
};

/**
 * 두 날짜가 같은 날인지 확인 (한국 시간 기준)
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 같은 날이면 true
 */
export const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // 한국 시간대 기준으로 날짜 비교
  const korea1 = d1.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  const korea2 = d2.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });

  return korea1 === korea2;
};

/**
 * 두 메시지 간에 날짜가 바뀌었는지 확인
 * @param currentMessage - 현재 메시지 날짜
 * @param previousMessage - 이전 메시지 날짜 (null일 수 있음)
 * @returns 날짜가 바뀌었으면 true
 */
export const shouldShowDateSeparator = (currentMessage: string, previousMessage: string | null): boolean => {
  if (!previousMessage) return true; // 첫 번째 메시지는 항상 날짜 표시

  // Invalid Date인 경우 날짜 구분선 표시하지 않음
  if (!currentMessage || !previousMessage) return false;

  const currentDate = new Date(currentMessage);
  const previousDate = new Date(previousMessage);

  if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
    return false;
  }

  return !isSameDay(currentMessage, previousMessage);
};
