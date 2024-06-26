import express from 'express';
import bcrypt from 'bcrypt'; // 1. 회원가입시 비밀번호 hash
import jwt from 'jsonwebtoken'; // 2. 로그인시 토큰발급
import { HTTP_STATUS } from '../constants/http-status.constant.js'; // status
import { MESSAGES } from '../constants/message.constant.js'; // 메시지
import { signUpValidator } from '../middlewares/validators/sign-up-validator.middleware.js'; // 1. 회원가입 미들웨어
import { signInValidator } from '../middlewares/validators/sign-in-validator.middleware.js'; // 2. 로그인 미들웨어
import { prisma } from '../utils/prisma.util.js'; // prisma
import { ACCESS_TOKEN_EXPIRES_IN, HASH_SALT_ROUNDS } from '../constants/auth.constant.js'; // 1. 회원가입 비밀번호
import { ACCESS_TOKEN_SECRET } from '../constants/env.constant.js'; // 2. 로그인시 access token 발급

const authRouter = express.Router();

/*1. 회원가입 */
authRouter.post('/sign-up', signUpValidator, async (req, res, next) => {
  try {
    // 1-1. 이메일, 비밀번호, 비밀번호 확인, 이름을 Request Body(`req.body`)로 전달 받습니다.
    const { email, password, name } = req.body;

    const existedUser = await prisma.user.findUnique({ where: { email } });

    // 1-3 만약에 이메일이 중복된 경우
    if (existedUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        status: HTTP_STATUS.CONFLICT,
        message: MESSAGES.AUTH.COMMON.EMAIL.DUPLICATED,
      });
    }
    // 1-4. 보안을 위해 비밀번호는 평문(Plain Text)으로 저장하지 않고 Hash 된 값을 저장합니다.
    const hashedPassword = bcrypt.hashSync(password, HASH_SALT_ROUNDS);
    // 1-2. 회원가입 
    // 1-2. 사용자 ID, 이메일, 이름, 역할, 생성일시, 수정일시를 반환합니다.
    const data = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // 비밀번호 hash 저장
        name,
      },
    });

    data.password = undefined; // 비밀번호 안나오게 하기

    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.AUTH.SIGN_UP.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/* 2. 로그인 */
authRouter.post('/sign-in', signInValidator, async (req, res, next) => {
  try {
    // 2-1. 이메일, 비밀번호를 Request Body(`req.body`)로 전달 받습니다.
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // 2-2. 비밀번호 일치 여부 확인
    const isPasswordMatched =
      user && bcrypt.compareSync(password, user.password);

    // 2-3. 일치하지 않는 경우 로그인 실패
    if (!isPasswordMatched) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.UNAUTHORIZED,
      });
    }
    // 2-4. AccessToken(Payload에 `사용자 ID`를 포함)을 생성합니다.
    const payload = { id: user.id };
    // 2-4. AccessToken(유효기한이 `12시간`)을 생성합니다.
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

    // const data = await generateAuthTokens(payload);

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.SIGN_IN.SUCCEED, // 로그인 성공
      data: {accessToken}, // 2-5. 로그인시 AccessToken 반환
    });
  } catch (error) {
    next(error);
  }
});

export { authRouter };