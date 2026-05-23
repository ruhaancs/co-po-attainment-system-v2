import { redirectIfAuthenticated } from "@/lib/auth";
import { LoginFormUnified } from "@/components/auth/login-form-unified";

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return <LoginFormUnified />;
}
