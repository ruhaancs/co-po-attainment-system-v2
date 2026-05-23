import { redirectIfAuthenticated } from "@/lib/auth";
import { getRegistrationOptions } from "@/lib/api/registration-options";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  await redirectIfAuthenticated();
  const { programs, departments, error } = await getRegistrationOptions();
  return (
    <RegisterForm
      initialPrograms={programs}
      initialDepartments={departments}
      loadError={error}
    />
  );
}
