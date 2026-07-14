package com.adityainfotech.societyms.application.dto.response;

import java.time.LocalDateTime;

public record PollResultResponse(
    Long pollId, Long noticeId, String question,
    String optionA, long votesA,
    String optionB, long votesB,
    String optionC, long votesC,
    String optionD, long votesD,
    long totalVotes, boolean isActive,
    LocalDateTime endsAt, String myVote
) {}
