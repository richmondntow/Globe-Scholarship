import Workspace from './workspace';
import { getSiteUser } from '../lib/auth';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default function Home(){return <ProtectedWorkspace/>;}
async function ProtectedWorkspace(){const user=await getSiteUser();if(!user)redirect('/login');return <Workspace user={{displayName:user.displayName,email:user.email}}/>;}
