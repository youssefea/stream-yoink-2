import { NextResponse } from "next/server";
import {
  followingQuery,
  walletQuery,
  lastYoinkedQuery,
  fetchSubgraphData,
} from "../api";
import { init, fetchQuery } from "@airstack/node";
import { kv } from "@vercel/kv";
import { account, walletClient, publicClient } from "./config";
import ERC20ABI from "./erc20abi.json";
import { formatEther } from "viem";

import {
  checkIsFollowingFarcasterUser,
  CheckIsFollowingFarcasterUserInput,
  CheckIsFollowingFarcasterUserOutput,
} from "@airstack/frames";

const URL =
  process.env.ENVIRONMENT === "local"
    ? process.env.LOCALHOST
    : process.env.PROD_URL;

init(process.env.AIRSTACK_KEY || "");

const USDCxAddress = process.env.SUPER_TOKEN_ADDRESS as `0x${string}`;

const notFollowingString = `https://i.imgur.com/V2MXezK.png`;

const welcomeString = (yoinker, totalLeft) =>
  `_${yoinker}_has the stream ! _${totalLeft} $DEGEN left in the pot`;

function getImgUrl(myString: string) {
  const myStringEncoded = encodeURIComponent(myString);
  return `${URL}/imgen?text=${myStringEncoded}&color=black,superfluid,black,black,black,black,black,black&size=10,24,8,8,8,8,8,8,8`;
}

const _html = (img, msg, action, url) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Frame</title>
    <mega property="og:image" content="${img}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${img}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="${msg}" />
    <meta property="fc:frame:button:1:action" content="${action}" />
    <meta property="fc:frame:button:1:target" content="${url}" />
    <meta property="fc:frame:button:2" content="🏆 Go to Leaderboard" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${URL}/leaderboard" />
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

  const input: CheckIsFollowingFarcasterUserInput = {
    fid: fid,
    isFollowing: [315653],
  };
  const { data: data1, error: error1 }: CheckIsFollowingFarcasterUserOutput =
    await checkIsFollowingFarcasterUser(input);

  console.log(data1);

  const _query2 = walletQuery(fid);
  const { data: results2 } = await fetchQuery(_query2, {
    id: fid,
  });

  const socials = results2.Socials.Social;
  const newAddress = socials[0].userAssociatedAddresses[1];

  if (data1 != null && data1[0].isFollowing != null) {
    if (!data1[0].isFollowing) {
      return new NextResponse(
        _html(notFollowingString, "🎩 Retry", "post", `${URL}`)
      );
    }
  }


  const balanceOfAccount: any = await publicClient.readContract({
    address: USDCxAddress,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [account.address],
  });

  const totalLeft = Number(formatEther(balanceOfAccount));

  return new NextResponse(
    _html(
      getImgUrl(welcomeString("tes", totalLeft.toFixed(0))),
      "🎩 Yoink",
      "post",
      `${URL}/check`
    )
  );
}

export const dynamic = "force-dynamic";
