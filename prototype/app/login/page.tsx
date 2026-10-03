import AuthForm from '../auth-form';
import {getSiteUser} from '../../lib/auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default function Login(){return <LoginScreen/>;}
async function LoginScreen(){if(await getSiteUser())redirect('/');return <AuthForm mode="login"/>;}
