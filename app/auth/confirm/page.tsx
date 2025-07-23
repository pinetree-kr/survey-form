import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { ConfirmPageClient } from './components/ConfirmPageClient'
import Link from 'next/link'

type ConfirmPageProps = {
    searchParams: Promise<{
        [key: string]: string | string[] | undefined
    }>
}

const getTokenHash = async (token_hash: string, type: string) => {
    const { env } = await getCloudflareContext({ async: true });
    const supabase = await createClient(env);

    return await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
    })

}


export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
    const paramsObj = await searchParams;
    const token_hash = paramsObj.token_hash as string;
    const type = paramsObj.type as string;

    if (!token_hash || !type) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8 p-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg
                                className="h-6 w-6 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            인증 실패
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            인증 정보가 올바르지 않습니다.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/auth/sign-in"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                로그인 페이지로 돌아가기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else {
        try {
            const { error } = await getTokenHash(token_hash, type);
            if (error) {
                // return <div>인증 정보가 올바르지 않습니다. {error.message}</div>
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="max-w-md w-full space-y-8 p-8">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <svg
                                        className="h-6 w-6 text-red-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </div>
                                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                                    인증 실패
                                </h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    {error.message ?? '인증 정보가 올바르지 않습니다.'}
                                </p>
                                <div className="mt-6">
                                    <Link
                                        href="/auth/sign-in"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        로그인 페이지로 돌아가기
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            return <ConfirmPageClient />
        } catch (error) {
            console.error(error)
            return <div>예상치 못한 오류가 발생했습니다</div>
        }
    }
} 