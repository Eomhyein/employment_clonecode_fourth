import jwt from 'jsonwebtoken';
import { HTTP_STATUS } from '../constants/http-status.constant.js'; // 인증에 실패한 경우
import { MESSAGES } from '../constants/message.constant.js'; // 메시지
import { ACCESS_TOKEN_SECRET } from '../constants/env.constant.js'; // 토큰
import { prisma } from '../utils/prisma.util.js';
// 3. AccessToke 사용자 인증 미들웨어
export const requireAccessToken = async (req, res, next) => {
  try {
    // 3-1. 인증 정보 파싱 헤더에 저장
    const authorization = req.headers.authorization;

    // 3-2. Authorization이 없는 경우
    if (!authorization) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN,
      });
    }

    // 3-3. JWT 표준 인증 형태와 일치하지 않는 경우
    const [type, accessToken] = authorization.split(' ');

    if (type !== 'Bearer') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NOT_SUPPORTED_TYPE,
      });
    }

    // 3-4. AccessToken이 없는 경우
    if (!accessToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NO_TOKEN,
      });
    }

    let payload; // 트라이 캐치 밖에서도 페이로드를 활용하기 위해 선언
    try {
      payload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    } catch (error) {
      // 3-5. AccessToken의 유효기한이 지난 경우
      if (error.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.AUTH.COMMON.JWT.EXPIRED,
        });
      }
      // 3-6. 그 밖의 AccessToken 검증에 실패한 경우
      else {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: MESSAGES.AUTH.COMMON.JWT.INVALID,
        });
      }
    }

    // 3-7. Payload에 담긴 사용자 ID와 일치하는 사용자가 없는 경우
    const { id } = payload;
    const user = await prisma.user.findUnique({ // 3-7(1). 비밀번호 제외하고 받아오고 싶으나 정식 버전에는 포함되어 있지 않다.
      where: { id },
      omit: { password: true }, // 3-7(2). 프리뷰 omit 사용해서 적용하면 비밀번호 제외하고 받아온다.
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.JWT.NO_USER,
      });
    } 

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
