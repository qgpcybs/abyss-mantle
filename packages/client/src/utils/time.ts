import dayjs from "dayjs";

export function unixTime() {
  return dayjs().valueOf() / 1000;
}

export function unixTimeSecond() {
  return dayjs().unix();
}
