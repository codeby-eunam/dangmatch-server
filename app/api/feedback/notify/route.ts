import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface FeedbackPayload {
  type: 'feedback' | 'report';
  message: string;
  nickname: string | null;
  uid: string | null;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  const { type, message, nickname, uid }: FeedbackPayload = await request.json();

  const subject = type === 'feedback'
    ? `[당겨먹자] 피드백이 도착했어요`
    : `[당겨먹자] 신고가 접수됐어요`;

  const body = `
유형: ${type === 'feedback' ? '피드백' : '신고'}
작성자: ${nickname ?? '비로그인'} ${uid ? `(${uid})` : ''}

내용:
${message}
  `.trim();

  try {
    await transporter.sendMail({
      from: `"당겨먹자 알림" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_NOTIFY_TO ?? process.env.GMAIL_USER,
      subject,
      text: body,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[이메일 발송 실패]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
