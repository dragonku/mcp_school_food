import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEIS_API_KEY = process.env.NEIS_API_KEY;

// 효원고등학교 정보 (올바른 코드)
const HYOWON_HIGH_SCHOOL = {
  name: '효원고등학교',
  code: '7530139',
  officeCode: 'J10'  // 경기도 교육청
};

async function fetchMealInfo(date) {
  try {
    console.log(`${date} 날짜의 급식 정보를 조회합니다...`);
    
    const response = await axios.get('https://open.neis.go.kr/hub/mealServiceDietInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        ATPT_OFCDC_SC_CODE: HYOWON_HIGH_SCHOOL.officeCode,
        SD_SCHUL_CODE: HYOWON_HIGH_SCHOOL.code,
        MLSV_YMD: date
      },
      responseType: 'json',
      responseEncoding: 'utf8'
    });

    console.log('API 응답 상태 코드:', response.status);
    console.log('API 응답 데이터:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('API 호출 중 오류가 발생했습니다:', error.message);
    if (error.response) {
      console.error('API 응답 데이터:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 2024년 4월 1일부터 5일까지의 급식 정보 조회
const dates = ['20240401', '20240402', '20240403', '20240404', '20240405'];
for (const date of dates) {
  fetchMealInfo(date);
} 