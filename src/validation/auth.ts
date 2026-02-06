import { z } from 'zod';

// 注册表单校验
export const registerSchema = z.object({
  email: z.email({ message: '邮箱格式不正确' }),
  username: z
    .string()
    .min(1, '请输入用户名')
    .min(3, '用户名至少 3 位')
    .max(32, '用户名最长 32 位'),
  password: z.string().min(1, '请输入密码').min(8, '密码至少 8 位'),
});

// 登录表单校验
export const LoginFormSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码').min(8, '密码至少 8 位'),
});

export const ForgotPasswordSchema = z.object({
  email: z.email({ message: '邮箱格式不正确' }),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(1, '请输入新密码').min(8, '密码至少 8 位'),
    confirmPassword: z.string().min(1, '请再次输入密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof LoginFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;
