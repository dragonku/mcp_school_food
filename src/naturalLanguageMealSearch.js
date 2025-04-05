import axios from 'axios';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const NEIS_API_KEY = process.env.NEIS_API_KEY;

// 사용자 입력을 받기 위한 인터페이스 생성
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 학교 검색 함수
async function searchSchool(schoolName) {
  try {
    console.log(`'${schoolName}' 학교를 검색합니다...`);
    
    const response = await axios.get('https://open.neis.go.kr/hub/schoolInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        pIndex: 1,
        pSize: 100,
        SCHUL_NM: schoolName
      },
      responseType: 'json',
      responseEncoding: 'utf8'
    });

    if (response.data?.schoolInfo?.[1]?.row) {
      return response.data.schoolInfo[1].row;
    } else {
      console.log('검색 결과가 없습니다.');
      return [];
    }
  } catch (error) {
    console.error('학교 검색 중 오류가 발생했습니다:', error.message);
    return [];
  }
}

// 급식 정보 조회 함수
async function fetchMealInfo(schoolInfo, date) {
  try {
    console.log(`${date} 날짜의 급식 정보를 조회합니다...`);
    
    const response = await axios.get('https://open.neis.go.kr/hub/mealServiceDietInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        ATPT_OFCDC_SC_CODE: schoolInfo.ATPT_OFCDC_SC_CODE,
        SD_SCHUL_CODE: schoolInfo.SD_SCHUL_CODE,
        MLSV_YMD: date
      },
      responseType: 'json',
      responseEncoding: 'utf8'
    });

    if (response.data?.mealServiceDietInfo?.[1]?.row?.[0]) {
      const meal = response.data.mealServiceDietInfo[1].row[0];
      return {
        date,
        menu: meal.DDISH_NM.split("<br/>").map(item => item.trim()),
        calories: meal.CAL_INFO,
        nutrients: meal.NTR_INFO ? meal.NTR_INFO.split("<br/>") : [],
        allergies: meal.ORPLC_INFO ? meal.ORPLC_INFO.split("<br/>") : []
      };
    } else {
      return { error: "해당 날짜의 급식 정보가 없습니다." };
    }
  } catch (error) {
    return { error: '급식 정보를 가져오는 중 오류가 발생했습니다: ' + error.message };
  }
}

// 급식 정보 출력 함수
function displayMealInfo(mealInfo) {
  if (mealInfo.error) {
    console.log(mealInfo.error);
    return;
  }

  console.log(`\n[${mealInfo.date} 급식 메뉴]`);
  console.log("┌────────────────────────────────────────────┬────────────┐");
  console.log("│                   메뉴                    │   칼로리   │");
  console.log("├────────────────────────────────────────────┼────────────┤");
  
  // 첫 번째 메뉴 항목
  console.log(`│ ${mealInfo.menu[0].padEnd(40)}│${mealInfo.calories.padEnd(10)}│`);
  
  // 나머지 메뉴 항목들
  for (let i = 1; i < mealInfo.menu.length; i++) {
    console.log(`│ ${mealInfo.menu[i].padEnd(40)}│          │`);
  }
  
  console.log("└────────────────────────────────────────────┴────────────┘");

  // 영양 정보 출력
  if (mealInfo.nutrients.length > 0) {
    console.log("\n[영양 정보]");
    mealInfo.nutrients.forEach(nutrient => {
      console.log(nutrient);
    });
  }

  // 알레르기 정보 출력
  console.log("\n[알레르기 정보]");
  console.log("1.난류 2.우유 3.메밀 4.땅콩 5.대두 6.밀 7.고등어 8.게 9.새우");
  console.log("10.돼지고기 11.복숭아 12.토마토 13.아황산류 14.호두 15.닭고기");
  console.log("16.쇠고기 17.오징어 18.조개류");
}

// 자연어에서 날짜 추출 함수
function extractDate(text) {
  // 연도 추출 (4자리 숫자)
  const yearMatch = text.match(/(\d{4})년/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  // 월 추출 (1-12 사이의 숫자)
  const monthMatch = text.match(/(\d{1,2})월/);
  const month = monthMatch ? monthMatch[1].padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // 일 추출 (1-31 사이의 숫자)
  const dayMatch = text.match(/(\d{1,2})일/);
  const day = dayMatch ? dayMatch[1].padStart(2, '0') : new Date().getDate().toString().padStart(2, '0');
  
  // 오늘, 어제, 내일 등의 키워드 처리
  if (text.includes('오늘')) {
    const today = new Date();
    return today.toISOString().slice(0, 10).replace(/-/g, '');
  } else if (text.includes('어제')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10).replace(/-/g, '');
  } else if (text.includes('내일')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
  }
  
  // 이번주, 다음주 등의 키워드 처리
  if (text.includes('이번주')) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    return monday.toISOString().slice(0, 10).replace(/-/g, '');
  } else if (text.includes('다음주')) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() - dayOfWeek + 8);
    return nextMonday.toISOString().slice(0, 10).replace(/-/g, '');
  }
  
  // 요일 처리 (월요일, 화요일 등)
  const weekdays = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
  for (let i = 0; i < weekdays.length; i++) {
    if (text.includes(weekdays[i])) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const targetDay = (i + 1) % 7; // 월요일은 1, 일요일은 0
      const diff = targetDay - dayOfWeek;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      return targetDate.toISOString().slice(0, 10).replace(/-/g, '');
    }
  }
  
  // 추출한 연, 월, 일로 날짜 문자열 생성
  return `${year}${month}${day}`;
}

// 자연어에서 학교명 추출 함수
function extractSchoolName(text) {
  // 학교명 패턴 (학교, 고등학교, 중학교, 초등학교 등으로 끝나는 단어)
  const schoolPattern = /([가-힣]+(?:초등|중|고등)?학교)/;
  const match = text.match(schoolPattern);
  
  if (match) {
    return match[1];
  }
  
  // 학교명이 추출되지 않은 경우
  return null;
}

// 자연어 처리 함수
async function processNaturalLanguage(input) {
  // 학교명 추출
  const schoolName = extractSchoolName(input);
  if (!schoolName) {
    console.log('학교명을 찾을 수 없습니다. 다시 입력해주세요.');
    return;
  }
  
  // 날짜 추출
  const date = extractDate(input);
  
  // 학교 검색
  const schools = await searchSchool(schoolName);
  
  if (schools.length === 0) {
    console.log('검색 결과가 없습니다.');
    return;
  }
  
  // 검색 결과가 여러 개인 경우 첫 번째 결과 사용
  const selectedSchool = schools[0];
  
  // 급식 정보 조회
  const mealInfo = await fetchMealInfo(selectedSchool, date);
  
  // 급식 정보 출력
  displayMealInfo(mealInfo);
}

// 메인 함수
async function main() {
  console.log('자연어로 학교 급식 정보를 조회합니다.');
  console.log('예시: "효원고등학교 2024년 4월 4일 급식" 또는 "효원고등학교 오늘 급식"');
  
  rl.question('질문을 입력하세요: ', async (input) => {
    await processNaturalLanguage(input);
    
    // 추가 조회 여부 확인
    rl.question('\n다른 질문을 입력하시겠습니까? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        main();
      } else {
        rl.close();
      }
    });
  });
}

// 프로그램 실행
main(); 