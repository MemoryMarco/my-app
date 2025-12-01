package com.liuyansh.repository;
import com.liuyansh.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface LikeRepository extends JpaRepository<Like, UUID> {
    Optional<Like> findByUserIdAndMessageId(String userId, UUID messageId);
    Optional<Like> findByUserIdAndReplyId(String userId, UUID replyId);
    List<Like> findByTsAfter(Instant timestamp);
}