/**
 * 시간 관련 유틸리티 함수들
 */

/**
 * 메시지 시간을 한국 시간 기준으로 포맷팅
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 한국 시간 기준 "오전/오후 시:분" 형식
 */
export const formatMessageTime = (dateString: string): string => {
  // 임시 메시지나 Invalid Date 처리
  if (!dateString) {
    return '전송 중...';
  }
  
  const date = new Date(dateString);
  
  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return '전송 중...';
  }
  
  return date.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Seoul'  // 한국 시간대 명시적 설정
  });
};

/**
 * 두 날짜가 같은 날인지 확인 (한국 시간 기준)
 * @param date1 - 첫 번째 날짜 문자열
 * @param date2 - 두 번째 날짜 문자열
 * @returns 같은 날이면 true, 다르면 false
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
 * 날짜를 한국 시간 기준으로 포맷팅
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 한국 시간 기준 "YYYY년 MM월 DD일" 형식
 */
export const formatMessageDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul'
  });
};

/**
 * 두 메시지 간에 날짜가 바뀌었는지 확인
 * @param currentMessage - 현재 메시지 날짜
 * @param previousMessage - 이전 메시지 날짜 (null일 수 있음)
 * @returns 날짜가 바뀌었으면 true
 */
export const shouldShowDateSeparator = (currentMessage: string, previousMessage: string | null): boolean => {
  if (!previousMessage) return true; // 첫 번째 메시지는 항상 날짜 표시
  
  // 임시 메시지나 Invalid Date인 경우 날짜 구분선 표시하지 않음
  if (!currentMessage || !previousMessage) return false;
  
  const currentDate = new Date(currentMessage);
  const previousDate = new Date(previousMessage);
  
  if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
    return false;
  }
  
  return !isSameDay(currentMessage, previousMessage);
};

/**
 * 상대적 시간 표시 (몇 분 전, 몇 시간 전 등)
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return formatMessageDate(dateString);
  }
};
