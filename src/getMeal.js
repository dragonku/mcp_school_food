import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEIS_API_KEY = process.env.NEIS_API_KEY;
const SCHOOL_INFO = {
  GYEONGGI_OFFICE_CODE: "J10",
  HYOWON_SCHOOL_CODE: "7530167"
};

async function getYesterdayMeal() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().split('T')[0].replace(/-/g, '');

  try {
    const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
      params: {
        KEY: NEIS_API_KEY,
        Type: "json",
        ATPT_OFCDC_SC_CODE: SCHOOL_INFO.GYEONGGI_OFFICE_CODE,
        SD_SCHUL_CODE: SCHOOL_INFO.HYOWON_SCHOOL_CODE,
        MLSV_YMD: date,
      }
    });

    if (response.data?.mealServiceDietInfo?.[1]?.row) {
      const meals = response.data.mealServiceDietInfo[1].row;
      let result = `[효원고등학교 어제(${date}) 급식 메뉴]\n\n`;

      for (const mealInfo of meals) {
        const menu = mealInfo.DDISH_NM.split("<br/>");
        const calories = mealInfo.CAL_INFO;
        result += `[${mealInfo.MMEAL_SC_NM} 메뉴]\n${menu.join("\n")}\n[칼로리 정보]\n${calories}\n\n`;
      }

      console.log(result.trim());
    } else {
      console.log("해당 날짜의 급식 정보가 없습니다.");
    }
  } catch (error) {
    console.error("급식 정보를 가져오는 중 오류가 발생했습니다:", error.message);
  }
}

getYesterdayMeal(); 