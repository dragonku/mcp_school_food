import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEIS_API_KEY = process.env.NEIS_API_KEY;

// 효원고등학교 정보
const HYOWON_HIGH_SCHOOL = {
  name: '효원고등학교',
  code: '7340124',
  officeCode: '10'  // 경기도 교육청
};

// NEIS API 응답 디버깅
async function debugApiResponse(date) {
  try {
    console.log(`${date} 날짜의 API 응답을 확인합니다...`);
    
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
    console.log('API 응답 헤더:', JSON.stringify(response.headers, null, 2));
    console.log('API 응답 데이터:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('API 호출 중 오류가 발생했습니다:', error.message);
    if (error.response) {
      console.error('API 응답 상태 코드:', error.response.status);
      console.error('API 응답 헤더:', JSON.stringify(error.response.headers, null, 2));
      console.error('API 응답 데이터:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 여러 날짜의 API 응답 디버깅
async function debugMultipleDates() {
  const dates = ['20240401', '20240402', '20240403', '20240404', '20240405'];
  
  for (const date of dates) {
    console.log(`\n${date} 날짜의 API 응답을 확인합니다...`);
    await debugApiResponse(date);
  }
}

// 여러 날짜의 API 응답 디버깅 실행
debugMultipleDates(); 