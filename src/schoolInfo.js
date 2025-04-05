import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEIS_API_KEY = process.env.NEIS_API_KEY;

// 교육청 코드 매핑
export const OFFICE_CODES = {
  '경기도': '10',
  '서울': '01',
  '인천': '02',
  '부산': '03',
  '대구': '04',
  '광주': '05',
  '대전': '06',
  '울산': '07',
  '세종': '08',
  '경남': '09',
  '강원': '11',
  '충북': '12',
  '충남': '13',
  '전북': '14',
  '전남': '15',
  '제주': '16'
};

// 학교 유형 매핑
export const SCHOOL_TYPES = {
  '초등학교': '초',
  '중학교': '중',
  '고등학교': '고',
  '특수학교': '특'
};

export async function searchSchools(officeName, schoolType, schoolName) {
  try {
    const officeCode = OFFICE_CODES[officeName];
    if (!officeCode) {
      throw new Error('올바른 교육청 이름을 입력해주세요.');
    }

    const response = await axios.get('https://open.neis.go.kr/hub/schoolInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        ATPT_OFCDC_SC_CODE: officeCode,
        SCHUL_KND_SC_NM: schoolType,
        SCHUL_NM: schoolName
      }
    });

    const schoolData = response.data;
    if (!schoolData?.schoolInfo?.[1]?.row) {
      return { error: "검색 결과가 없습니다." };
    }

    return schoolData.schoolInfo[1].row.map(school => ({
      name: school.SCHUL_NM,
      code: school.SD_SCHUL_CODE,
      address: school.ORG_RDNMA,
      officeCode: school.ATPT_OFCDC_SC_CODE
    }));

  } catch (error) {
    return { error: '학교 검색 중 오류가 발생했습니다: ' + error.message };
  }
}

export function getOfficeList() {
  return Object.keys(OFFICE_CODES);
}

export function getSchoolTypes() {
  return Object.keys(SCHOOL_TYPES);
} 