import Joi from 'joi';
import { MESSAGES } from '../../constants/message.constant.js';
import { MIN_RESUME_LENGTH } from '../../constants/resume.constant.js';

// 이력서 수정 유효성 검증 및 에러 처리
const schema = Joi.object({
  title: Joi.string(),
  content: Joi.string().min(MIN_RESUME_LENGTH).messages({
    'string.min': MESSAGES.RESUMES.COMMON.CONTENT.MIN_LENGTH,
  }),
})
  .min(1) // 최소 하나의 값은 들어가야된다.
  .messages({
    'object.min': MESSAGES.RESUMES.UPDATE.NO_BODY_DATA,
  });

export const updateResumeValidator = async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
