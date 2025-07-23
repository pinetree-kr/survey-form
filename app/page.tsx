import Link from 'next/link'
import { CheckIcon, StarIcon, ChartBarIcon, CursorArrowRaysIcon, UserGroupIcon, CogIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              더 스마트한
              <span className="text-blue-600"> 설문조사</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              실시간 분석과 고급 조건부 로직으로 차별화된 설문조사 플랫폼입니다.
              복잡한 설문도 쉽게 만들고, 응답을 실시간으로 분석하세요.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/sign-up"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                무료로 시작하기
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                기능 살펴보기 <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">강력한 기능</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              설문조사를 더욱 스마트하게
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              기존 설문 도구들과는 다른 고급 기능들로 차별화된 경험을 제공합니다.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <ChartBarIcon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  실시간 응답 분석
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    응답이 들어올 때마다 실시간으로 통계가 업데이트됩니다. 
                    설문 진행 상황을 즉시 확인하고 인사이트를 얻으세요.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <CursorArrowRaysIcon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  고급 조건부 로직
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    복잡한 분기 설문과 조건부 표시 기능으로 
                    응답자에게 맞춤형 질문을 제공합니다.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <UserGroupIcon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  다양한 문항 타입
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    단순 선택부터 복합형 문항까지 다양한 타입을 지원합니다.
                    응답자 식별 옵션도 제공합니다.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">차별화된 경험</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              왜 우리 플랫폼을 선택해야 할까요?
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              기존 설문 도구들과 비교해보세요.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="px-6 py-8 sm:p-10">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* 우리 플랫폼 */}
                  <div className="relative">
                    <div className="absolute -top-4 left-0">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        <StarIcon className="h-4 w-4 mr-1" />
                        추천
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">우리 플랫폼</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">실시간 응답 분석</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">고급 조건부 로직</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">복합형 문항 지원</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">직관적인 편집기</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">응답자 식별 옵션</span>
                      </li>
                    </ul>
                  </div>

                  {/* 구글폼 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">구글폼</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">기본적인 설문 기능</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">구글 생태계 연동</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0">×</div>
                        <span className="text-sm text-gray-600">제한적인 조건부 로직</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0">×</div>
                        <span className="text-sm text-gray-600">실시간 분석 부족</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0">×</div>
                        <span className="text-sm text-gray-600">복잡한 설문 제한</span>
                      </li>
                    </ul>
                  </div>

                  {/* 네이버폼 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">네이버폼</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">한국어 지원</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">간단한 사용법</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0">×</div>
                        <span className="text-sm text-gray-600">기본적인 기능만</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0">×</div>
                        <span className="text-sm text-gray-600">고급 분석 부족</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0">×</div>
                        <span className="text-sm text-gray-600">복잡한 설문 불가</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">실제 사용 예시</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              어떻게 작동하는지 확인해보세요
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              실제 설문 예시를 통해 플랫폼의 강력한 기능을 체험해보세요.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">고객 만족도 조사</h3>
                <p className="text-gray-600 mb-4">
                  조건부 로직을 활용한 스마트한 고객 만족도 조사 예시입니다.
                </p>
                <Link
                  href="/forms/demo-customer-satisfaction"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  체험해보기
                </Link>
              </div>
              <div className="rounded-lg bg-gray-50 p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">제품 피드백 수집</h3>
                <p className="text-gray-600 mb-4">
                  다양한 문항 타입을 활용한 제품 피드백 수집 설문입니다.
                </p>
                <Link
                  href="/forms/demo-product-feedback"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  체험해보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              지금 바로 시작하세요
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              무료로 가입하고 차별화된 설문조사 플랫폼을 경험해보세요.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/sign-up"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                무료 가입하기
              </Link>
              <Link
                href="/auth/sign-in"
                className="text-sm font-semibold leading-6 text-white"
              >
                이미 계정이 있으신가요? <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
