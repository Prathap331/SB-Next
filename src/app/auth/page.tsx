import Header from '../../components/Header';
import AuthForm from '@/components/AuthForm';

export default function Auth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
