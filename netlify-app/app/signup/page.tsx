import AuthForm from '../auth-form';
import {getSiteUser} from '../../lib/auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default function Signup(){return <SignupScreen/>;}
async function SignupScreen(){if(await getSiteUser())redirect('/');return <AuthForm mode="signup"/>;}
