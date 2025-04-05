import { fetchSpecificDateMeal } from './fetchMeal.js';

// 효원고등학교 정보
const HYOWON_HIGH_SCHOOL = {
  name: '효원고등학교',
  code: '7340124',
  officeCode: '10'  // 경기도 교육청
};

// 수동으로 날짜를 설정하여 급식 정보 조회
async function fetchManualDateMeal(date) {
  try {
    console.log(`${date} 날짜의 급식 정보를 조회합니다...`);
    
    const mealInfo = await fetchSpecificDateMeal(HYOWON_HIGH_SCHOOL, date);
    
    if (mealInfo.error) {
      console.log(`오류: ${mealInfo.error}`);
      return;
    }
    
    console.log(`\n[${HYOWON_HIGH_SCHOOL.name} ${date} 급식 메뉴]\n`);
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

    // 알레르기 정보 출력
    console.log("\n[알레르기 정보]");
    console.log("1.난류 2.우유 3.메밀 4.땅콩 5.대두 6.밀 7.고등어 8.게 9.새우");
    console.log("10.돼지고기 11.복숭아 12.토마토 13.아황산류 14.호두 15.닭고기");
    console.log("16.쇠고기 17.오징어 18.조개류");
    
  } catch (error) {
    console.error('급식 정보를 가져오는 중 오류가 발생했습니다:', error.message);
  }
}

// 2024년 4월 4일 급식 정보 조회 (작년 같은 날짜)
fetchManualDateMeal('20240404'); 