import Joi from 'joi';
import { MESSAGES } from '../../constants/message.constant.js';
import { MIN_RESUME_LENGTH } from '../../constants/resume.constant.js';

// 1. 이력서 관리
// 1-2. **유효성 검증 및 에러 처리**
//     - **제목, 자기소개 중 하나라도 빠진 경우** - “OO을 입력해 주세요”
//     - **자기소개 글자 수가 150자 보다 짧은 경우** - “자기소개는 150자 이상 작성해야 합니다.”
const schema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': MESSAGES.RESUMES.COMMON.TITLE.REQUIRED,
  }),
  content: Joi.string().min(MIN_RESUME_LENGTH).required().messages({
    'any.required': MESSAGES.RESUMES.COMMON.CONTENT.REQUIRED,
    'string.min': MESSAGES.RESUMES.COMMON.CONTENT.MIN_LENGTH,
  }),
});

export const createResumeValidator = async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
