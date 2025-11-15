import SignupForm from "@/src/app/components/signupForm";

export default function SignupPage() {
  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Register your Account
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          See what is going on with your business
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
