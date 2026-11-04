import { cookies } from "next/headers";
import { getMessages } from "../../../../messages";
import { LOCALE_COOKIE, parseLocale } from "../../../lib/locale";
import { SharedUnavailable } from "../../../components/shared-unavailable";

export default async function SharedNotFound() {
  const messages = getMessages(parseLocale((await cookies()).get(LOCALE_COOKIE)?.value));
  return <SharedUnavailable messages={messages} />;
}
