import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEIS_API_KEY = process.env.NEIS_API_KEY;

async function verifySchool() {
  try {
    console.log('학교 정보를 확인합니다...');
    
    const response = await axios.get('https://open.neis.go.kr/hub/schoolInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        SCHUL_NM: '효원고등학교',
        ATPT_OFCDC_SC_CODE: '10'  // 경기도 교육청
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

verifySchool(); 