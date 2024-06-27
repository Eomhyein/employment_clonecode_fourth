import express from 'express';
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js';
import { createResumeValidator } from '../middlewares/validators/create-resume-validator.middleware.js';
import { prisma } from '../utils/prisma.util.js';
import { updateResumeValidator } from '../middlewares/validators/update-resume-validator.middleware.js';
// import { USER_ROLE } from '../constants/user.constant.js';
// import { requireRoles } from '../middlewares/require-roles.middleware.js';
import { updateResumeStatusValidator } from '../middlewares/validators/update-resume-status-validator.middleware.js';

const resumesRouter = express.Router();

// 1. 이력서 생성
resumesRouter.post('/', createResumeValidator, async (req, res, next) => {
  try {
    // 1-1. 사용자 정보는 인증 Middleware(`req.user`)를 통해서 전달 받습니다.
    // 1-2. - 제목, 자기소개를 Request Body(`req.body`)로 전달 받습니다.
    const user = req.user;
    const { title, content } = req.body;
    const authorId = user.id; // 작성자 id는 로그인한 사용자 id

    // 1-3. 이력서 ID, 작성자 ID, 제목, 자기소개, 지원 상태, 생성일시, 수정일시를 반환합니다.
    // 이력서 ID, 지원 상태, 생성일시, 수정일시는 자동 생성됩니다.
    const data = await prisma.resume.create({
      data: {
        authorId,
        title,
        content,
      },
    });

    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.RESUMES.CREATE.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// 2. 이력서 목록 조회
resumesRouter.get('/', async (req, res, next) => {
  try {
    const user = req.user; // 2-1. 사용자 정보는 인증 Middleware(`req.user`)를 통해서 전달 받습니다.
    const authorId = user.id;

    let { sort } = req.query; //  2-2. Query Parameters(`req.query`)으로 정렬 조건을 받습니다.

    sort = sort?.toLowerCase(); // 2-2. 대소문자 구분 없이 동작해야 합니다. (소문자로 변환)
    if (sort !== 'desc' && sort !== 'asc') { // 2-2 생성일시 기준 정렬은 `과거순(ASC),` `최신순(DESC)`으로 전달 받습니다.  
      sort = 'desc'; // 2-2. 값이 없는 경우 `최신순(DESC)`** 정렬을 기본으로 합니다.
    }
    // // 선택 1 역할에 따른 결과 분기, 이력서 목록 조회
    // const whereCondition = {};
    // // 2-1 채용 담당자인 경우
    // if (user.role === USER_ROLE.RECRUITER) {
    //   // 2-2 status를 받고, query 조건에 추가
    //   const { status } = req.query;

    //   if (status) {
    //     whereCondition.status = status;
    //   }
    // }
    // // 2-3 채용 담당자가 아닌 경우(지원자의 경우)
    // else {
    //   // 2-4 자신이 작성한 이력서만 조회
    //   whereCondition.authorId = authorId;
    // }

    // 2-3. 이력서 목록 조회
    let data = await prisma.resume.findMany({
      where:{authorId },
      // where: whereCondition,
      orderBy: {
        createdAt: sort,
      },
      include: {
        author: true,
      },
    });
    // 2-4. data는 map을 이용해 authorName을 추가한다.
    // 2-4. 이력서 ID, 작성자 이름, 제목, 자기소개, 지원 상태, 생성일시, 수정일시의 목록을 반환합니다.
    data = data.map((resume) => {
      return {
        id: resume.id,
        authorName: resume.author.name,
        title: resume.title,
        content: resume.content,
        status: resume.status,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      };
    });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_LIST.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// 3. 이력서 상세 조회
resumesRouter.get('/:id', async (req, res, next) => {
  try {
    const user = req.user; // 3-1. 사용자 정보는 인증 Middleware(`req.user`)를 통해서 전달 받습니다.
    const authorId = user.id;

    const { id } = req.params; // 3-2. 이력서 ID를 Path Parameters(`req.params`)로 전달 받습니다.

    // const whereCondition = { id: +id };

    // if (user.role !== USER_ROLE.RECRUITER) { // DB에서 이력서 조회 시 이력서 ID, 작성자 ID가 모두 일치해야 합니다.
    //   whereCondition.authorId = authorId;
    // }

    let data = await prisma.resume.findUnique({
      where: {id: +id, authorId }, // 3-3. 현재 로그인 한 사용자가 작성한 이력서만 조회합니다.
      // where: whereCondition,
      include: { author: true },
    });

    if (!data) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }
    // 이력서 ID, 작성자 이름, 제목, 자기소개, 지원 상태, 생성일시, 수정일시의 목록을 반환합니다.
    data = {
      id: data.id,
      authorName: data.author.name, // 작성자 ID가 아닌 작성자 이름을 반환하기 위해 스키마에 정의 한 Relation을 활용해 조회합니다.
      title: data.title,
      content: data.content,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_DETAIL.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// 4. 이력서 수정
resumesRouter.put('/:id', updateResumeValidator, async (req, res, next) => {
  try {
    const user = req.user; // 사용자 정보는 인증 Middleware(`req.user`)를 통해서 전달 받습니다.
    const authorId = user.id;

    const { id } = req.params; // 이력서 ID를 Path Parameters(`req.params`)로 전달 받습니다.

    const { title, content } = req.body; // 제목, 자기소개를 Request Body(`req.body`)로 전달 받습니다.

    let existedResume = await prisma.resume.findUnique({
      where: { id: +id, authorId },
    });

    if (!existedResume) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }

    const data = await prisma.resume.update({
      where: { id: +id, authorId },
      data: {
        ...(title && { title }),
        ...(content && { content }), // 제목, 자기소개는 개별 수정이 가능합니다.
      }
    });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.UPDATE.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// 5. 이력서 삭제
resumesRouter.delete('/:id', async (req, res, next) => {
  try {
    const user = req.user;
    const authorId = user.id;

    const { id } = req.params;

    // 5-1. 이력서 정보가 없는 경우
    let existedResume = await prisma.resume.findUnique({
      where: { id: +id, authorId },
    });

    if (!existedResume) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }
    // 5-2. 이력서가 있는 경우
    const data = await prisma.resume.delete({ where: { id: +id, authorId } });

    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.DELETE.SUCCEED,
      data: { id: data.id },
    });
  } catch (error) {
    next(error);
  }
});



// // 선택2 Transaction 이력서 지원 상태 변경
// resumesRouter.patch(
//   '/:id/status',
//   requireRoles([USER_ROLE.RECRUITER]),
//   updateResumeStatusValidator,
//   async (req, res, next) => {
//     try {
//       const user = req.user;
//       const recruiterId = user.id;

//       const { id } = req.params;

//       const { status, reason } = req.body;

//       // 2-1 트랜잭션
//       await prisma.$transaction(async (tx) => {
//         // 2-2 이력서 정보 조회
//         const existedResume = await tx.resume.findUnique({
//           where: { id: +id },
//         });

//         // 2-3 이력서 정보가 없는 경우
//         if (!existedResume) {
//           return res.status(HTTP_STATUS.NOT_FOUND).json({
//             status: HTTP_STATUS.NOT_FOUND,
//             message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
//           });
//         }

//         // 2-4 이력서 지원 상태 수정
//         const updatedResume = await tx.resume.update({
//           where: { id: +id },
//           data: { status },
//         });

//         // 2-5 이력서 로그 생성
//         const data = await tx.resumeLog.create({
//           data: {
//             recruiterId, // 이력서 로그 ID
//             resumeId: existedResume.id, // 채용담당자 ID
//             oldStatus: existedResume.status, // 예전 상태
//             newStatus: updatedResume.status, // 새로운 상태
//             reason, // 사유
//           },
//         });

//         return res.status(HTTP_STATUS.OK).json({
//           status: HTTP_STATUS.OK,
//           message: MESSAGES.RESUMES.UPDATE.STATUS.SUCCEED,
//           data,
//         });
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// );
// // 선택3. Transaction 이력서 (Logs)로그 목록 조회
// resumesRouter.get(
//   '/:id/logs',
//   requireRoles([USER_ROLE.RECRUITER]),
//   async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       let data = await prisma.resumeLog.findMany({
//         where: {
//           resumeId: +id,
//         },
//         orderBy: { createdAt: 'desc' },
//         include: {
//           recruiter: true, // 채용담당자
//         },
//       });

//       data = data.map((log) => {
//         return {
//           id: log.id,
//           recruiterName: log.recruiter.name,
//           resumeId: log.resumeId,
//           oldStatus: log.oldStatus,
//           newStatus: log.newStatus,
//           reason: log.reason,
//           createdAt: log.createdAt,
//         };
//       });

//       return res.status(HTTP_STATUS.OK).json({
//         status: HTTP_STATUS.OK,
//         message: MESSAGES.RESUMES.READ_LIST.LOG.SUCCEED,
//         data,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// );

export { resumesRouter };
