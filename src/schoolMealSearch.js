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

// 날짜 입력 함수
function promptForDate() {
  return new Promise((resolve) => {
    rl.question('조회할 날짜를 입력하세요 (YYYYMMDD 형식, 예: 20240404): ', (date) => {
      resolve(date);
    });
  });
}

// 메인 함수
async function main() {
  try {
    // 학교명 입력 받기
    rl.question('학교명을 입력하세요: ', async (schoolName) => {
      // 학교 검색
      const schools = await searchSchool(schoolName);
      
      if (schools.length === 0) {
        rl.close();
        return;
      }
      
      // 검색 결과가 여러 개인 경우 선택
      let selectedSchool;
      if (schools.length > 1) {
        console.log('\n검색 결과:');
        schools.forEach((school, index) => {
          console.log(`${index + 1}. ${school.SCHUL_NM} (${school.ATPT_OFCDC_SC_NM})`);
        });
        
        rl.question('선택할 학교 번호를 입력하세요: ', (choice) => {
          const index = parseInt(choice) - 1;
          if (index >= 0 && index < schools.length) {
            selectedSchool = schools[index];
            processSchoolSelection(selectedSchool);
          } else {
            console.log('잘못된 선택입니다.');
            rl.close();
          }
        });
      } else {
        selectedSchool = schools[0];
        processSchoolSelection(selectedSchool);
      }
    });
  } catch (error) {
    console.error('오류가 발생했습니다:', error.message);
    rl.close();
  }
}

// 학교 선택 후 처리 함수
async function processSchoolSelection(school) {
  console.log(`\n선택한 학교: ${school.SCHUL_NM} (${school.ATPT_OFCDC_SC_NM})`);
  
  // 날짜 입력 받기
  const date = await promptForDate();
  
  // 급식 정보 조회
  const mealInfo = await fetchMealInfo(school, date);
  
  // 급식 정보 출력
  displayMealInfo(mealInfo);
  
  // 추가 조회 여부 확인
  rl.question('\n다른 날짜의 급식 정보를 조회하시겠습니까? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      processSchoolSelection(school);
    } else {
      rl.close();
    }
  });
}

// 프로그램 실행
main(); 