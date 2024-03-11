import { NextResponse } from "next/server";
import {
  followingQuery,
  walletQuery,
  lastYoinkedQuery,
  fetchSubgraphData,
} from "../api";
import { init, fetchQuery } from "@airstack/node";
import { account, walletClient, publicClient } from "./config";
import ABI from "./abi.json";
import {kv} from "@vercel/kv";

const URL =
  process.env.ENVIRONMENT === "local"
    ? process.env.LOCALHOST
    : process.env.PROD_URL;

// USDC contract address on Base
const contractAddress = "0xcfA132E353cB4E398080B9700609bb008eceB125";
const USDCxAddress = "0xD6FAF98BeFA647403cc56bDB598690660D5257d2";

init(process.env.AIRSTACK_KEY || "");

const noConnectedString = `
You don't have a connected wallet !\n
Connect a wallet to your farcaster account
`;

const notFollowingString = `
You are not following us !\n
Follow to get your Yoinked Stream
`;

const reyoinkedString = `
You have to wait 2 hours\n
to be able to yoink again !
`;

const congratsString = (userHandle) => `
Congrats ${userHandle}\n
you got your stream !
`;

function getImgUrl(myString: string) {
  const myStringEncoded = encodeURIComponent(myString);
  return `${URL}/imgen?text=${myStringEncoded}`;
}

const flowRate = 380517503805;
let address = "0xD85b187B75fcD84341A0696D2FB3db575F1adE18";

const _html = (img, msg, action, url) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Frame</title>
    <mega property="og:image" content="${img}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${img}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="${msg}" />
    <meta property="fc:frame:button:1:action" content="${action}" />
    <meta property="fc:frame:button:1:target" content="${url}" />
    <meta property="fc:frame:post_url" content="${url}" />
  </head>
</html>
`;

export async function POST(req) {
  const data = await req.json();

  const { untrustedData } = data;
  const { fid } = untrustedData;

  const _query = followingQuery(fid);
  const { data: results } = await fetchQuery(_query, {
    id: fid,
  });

  const _query2 = walletQuery(fid);
  const { data: results2 } = await fetchQuery(_query2, {
    id: fid,
  });

  const socials = results2.Socials.Social;
  const newAddress = socials[0].userAssociatedAddresses[1];

  if (!newAddress) {
    return new NextResponse(
      _html(getImgUrl(noConnectedString), "Retry", "post", `${URL}`)
    );
  }

  if (!results.Wallet.socialFollowers.Follower) {
    return new NextResponse(
      _html(getImgUrl(notFollowingString), "Retry", "post", `${URL}`)
    );
  }

  const _query3 = lastYoinkedQuery(newAddress);
  const result3 = await fetchSubgraphData(_query3);
  const lastYoink =
    result3.data.account.outflows[0] == null
      ? 0
      : result3.data.account.outflows[0].updatedAtTimestamp;
  const now = Math.round(Date.now()/1000);

  console.log(Number(lastYoink)+7200000)
  console.log(now)

  if (Number(lastYoink)+7200 > now) {
    return new NextResponse(
      _html(getImgUrl(reyoinkedString), "Retry", "post", `${URL}`)
    );
  }

  const receiverCurrentFlowRate = await publicClient.readContract({
    address: contractAddress,
    abi: ABI,
    functionName: "getFlowrate",
    args: [USDCxAddress, account.address, address],
  });

  if (Number(receiverCurrentFlowRate) > 0) {
    const { request: deleteStream } = await publicClient.simulateContract({
      address: contractAddress,
      abi: ABI,
      functionName: "deleteFlow",
      account,
      args: [USDCxAddress, account.address, address, "0x0"],
    });
    await walletClient.writeContract(deleteStream);
  }

  address = newAddress;
  const { request: startStream } = await publicClient.simulateContract({
    address: contractAddress,
    abi: ABI,
    functionName: "setFlowrate",
    account,
    args: [USDCxAddress, address, flowRate],
  });
  await walletClient.writeContract(startStream);

  const userHandle =
  results.Wallet.socialFollowers.Follower[0].followerAddress.socials[0].profileHandle;

  await kv.hset('currentYoinker', { profileHandle: userHandle, address: address});
  await kv.zincrby('yoinkedStreams', 1, userHandle);

  return new NextResponse(
    _html(
      getImgUrl(congratsString(userHandle)),
      "See in Dashboard",
      "link",
      `https://app.superfluid.finance/?view=${address}`
    )
  );
}

export const dynamic = "force-dynamic";
