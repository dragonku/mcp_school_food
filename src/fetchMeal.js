import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEIS_API_KEY = process.env.NEIS_API_KEY;

// 어제 날짜를 YYYYMMDD 형식으로 반환하는 함수
export function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10).replace(/-/g, '');
}

function formatMealInfo(mealData) {
  if (!mealData?.mealServiceDietInfo?.[1]?.row) {
    return "급식 정보가 없습니다.";
  }

  const meal = mealData.mealServiceDietInfo[1].row[0];
  const menuItems = meal.DDISH_NM.split("<br/>").map(item => item.trim());
  const calories = meal.CAL_INFO;
  const nutrients = meal.NTR_INFO ? 
    Object.fromEntries(
      meal.NTR_INFO.split("<br/>")
        .map(info => info.split(" : "))
        .map(([key, value]) => [key.trim(), value.trim()])
    ) : {};

  return {
    menuItems,
    calories,
    nutrients
  };
}

function createTable(data) {
  // 테이블 헤더
  const header = "┌──────┬────────────────────────────────────────────┬────────────┐\n";
  const headerText = "│ 요일 │                   메뉴                    │   칼로리   │\n";
  const separator = "├──────┼────────────────────────────────────────────┼────────────┤\n";
  const footer = "└──────┴────────────────────────────────────────────┴────────────┘\n";

  let table = header + headerText + separator;

  // 데이터 행 추가
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const day = ` ${row.date} `;
    const menus = row.menus.menuItems.map(menu => menu.trim());
    const calories = row.menus.calories;

    // 첫 번째 줄
    table += `│${day.padEnd(6)}│ ${menus[0].padEnd(40)}│${calories.padEnd(10)}│\n`;

    // 나머지 메뉴 줄
    for (let j = 1; j < menus.length; j++) {
      table += `│      │ ${menus[j].padEnd(40)}│          │\n`;
    }

    // 마지막 줄이 아니면 구분선 추가
    if (i < data.length - 1) {
      table += separator;
    }
  }

  // 테이블 푸터 추가
  table += footer;

  // 알레르기 정보 추가
  table += "\n[알레르기 정보]\n";
  table += "1.난류 2.우유 3.메밀 4.땅콩 5.대두 6.밀 7.고등어 8.게 9.새우\n";
  table += "10.돼지고기 11.복숭아 12.토마토 13.아황산류 14.호두 15.닭고기\n";
  table += "16.쇠고기 17.오징어 18.조개류\n";

  return table;
}

export async function fetchSpecificDateMeal(schoolInfo, date) {
  try {
    const response = await axios.get('https://open.neis.go.kr/hub/mealServiceDietInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        ATPT_OFCDC_SC_CODE: schoolInfo.officeCode,
        SD_SCHUL_CODE: schoolInfo.code,
        MLSV_YMD: date
      },
      responseType: 'json',
      responseEncoding: 'utf8'
    });

    const mealData = response.data;
    if (!mealData?.mealServiceDietInfo?.[1]?.row?.[0]) {
      return { error: "해당 날짜의 급식 정보를 가져올 수 없습니다." };
    }

    const meal = mealData.mealServiceDietInfo[1].row[0];
    const menuItems = meal.DDISH_NM.split("<br/>")
      .map(item => item.trim())
      .filter(item => item.length > 0);

    return {
      date,
      menu: menuItems,
      calories: meal.CAL_INFO,
      school: schoolInfo.name
    };

  } catch (error) {
    return { error: '급식 정보를 가져오는 중 오류가 발생했습니다: ' + error.message };
  }
}

export async function fetchThisWeekMeals(schoolInfo) {
  try {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const startDate = monday.toISOString().slice(0, 10).replace(/-/g, '');
    const endDate = friday.toISOString().slice(0, 10).replace(/-/g, '');

    const meals = [];
    for (let date = new Date(monday); date <= friday; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const meal = await fetchSpecificDateMeal(schoolInfo, dateStr);
      if (!meal.error) {
        meals.push(meal);
      }
    }

    return {
      period: `${startDate} ~ ${endDate}`,
      meals
    };

  } catch (error) {
    return { error: '주간 급식 정보를 가져오는 중 오류가 발생했습니다: ' + error.message };
  }
}

async function fetchMealInfo(startDate, endDate) {
  try {
    const response = await axios.get('https://open.neis.go.kr/hub/mealServiceDietInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        ATPT_OFCDC_SC_CODE: SCHOOL_INFO.ATPT_OFCDC_SC_CODE,
        SD_SCHUL_CODE: SCHOOL_INFO.SD_SCHUL_CODE,
        MLSV_FROM_YMD: startDate,
        MLSV_TO_YMD: endDate
      },
      responseType: 'json',
      responseEncoding: 'utf8'
    });
    
    return response.data;
  } catch (error) {
    console.error('급식 정보를 가져오는 중 오류가 발생했습니다:', error.message);
    if (error.response) {
      console.error('API 응답:', error.response.data);
    }
    return null;
  }
}

// 이번 주 급식 정보 조회
fetchThisWeekMeals();

// 4월 4일 급식 정보 조회
fetchSpecificDateMeal('20250404'); 