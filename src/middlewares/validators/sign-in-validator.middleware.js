import Joi from 'joi';
import { MESSAGES } from '../../constants/message.constant.js';

// 2. 로그인 API
// - **로그인 정보 중 하나라도 빠진 경우** - “OOO을 입력해 주세요.”
// - **이메일 형식에 맞지 않는 경우** - “이메일 형식이 올바르지 않습니다.”
// - **이메일로 조회되지 않거나 비밀번호가 일치하지 않는 경우** - “인증 정보가 유효하지 않습니다.”

const schema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.EMAIL.REQUIRED,
    'string.email': MESSAGES.AUTH.COMMON.EMAIL.INVALID_FORMAT,
  }),
  password: Joi.string().required().messages({
    'any.required': MESSAGES.AUTH.COMMON.PASSWORD.REQURIED,
    // 패스워드 글자가 몇 글자인지 알려주지 않는다(보안을 위해)
  }),
});

export const signInValidator = async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};




// 서비스 사용을 위해 인증을 진행합니다.

