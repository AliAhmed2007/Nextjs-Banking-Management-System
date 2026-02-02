import AuthForm from "@/components/AuthForm";

async function SignUp() {
  return (
    <section className="flex-center size-full max-sm:px-6">
      <AuthForm type="sign-up" />
    </section>
  );
}

export default SignUp;
