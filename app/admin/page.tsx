import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function FormViewPage() {
    const { NEXT_PUBLIC_APP_URL } = (await getCloudflareContext({ async: true })).env;
    return (
        <div>
            hello admin
        </div>
    )
}