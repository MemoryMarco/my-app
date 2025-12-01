package com.liuyansh.service;
import com.liuyansh.entity.Like;
import com.liuyansh.entity.Message;
import com.liuyansh.entity.Reply;
import com.liuyansh.repository.LikeRepository;
import com.liuyansh.repository.MessageRepository;
import com.liuyansh.repository.ReplyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final ReplyRepository replyRepository;
    private final LikeRepository likeRepository;
    public MessageService(MessageRepository messageRepository, ReplyRepository replyRepository, LikeRepository likeRepository) {
        this.messageRepository = messageRepository;
        this.replyRepository = replyRepository;
        this.likeRepository = likeRepository;
    }
    public List<Message> getAllMessages() {
        // This is a simplified fetch. A real implementation would need to handle
        // the N+1 problem when fetching nested replies.
        return messageRepository.findAll();
    }
    @Transactional
    public Message createMessage(String text, String userId, String phoneMasked) {
        Message message = new Message(null, userId, phoneMasked, text, Instant.now(), 0, null, null);
        return messageRepository.save(message);
    }
    @Transactional
    public Optional<Reply> createReply(UUID messageId, UUID parentReplyId, String text, String userId, String phoneMasked) {
        // Depth check logic would be needed here.
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) return Optional.empty();
        Reply parentReply = (parentReplyId != null) ? replyRepository.findById(parentReplyId).orElse(null) : null;
        Reply reply = new Reply(null, userId, phoneMasked, text, Instant.now(), 0, message, parentReply, null, null);
        return Optional.of(replyRepository.save(reply));
    }
    @Transactional
    public boolean toggleLike(String userId, UUID targetId, String type) {
        if ("message".equals(type)) {
            Optional<Like> existingLike = likeRepository.findByUserIdAndMessageId(userId, targetId);
            Message message = messageRepository.findById(targetId).orElseThrow();
            if (existingLike.isPresent()) {
                likeRepository.delete(existingLike.get());
                message.setLikes(message.getLikes() - 1);
                messageRepository.save(message);
                return false; // Unliked
            } else {
                Like newLike = new Like(null, userId, Instant.now(), message, null);
                likeRepository.save(newLike);
                message.setLikes(message.getLikes() + 1);
                messageRepository.save(message);
                return true; // Liked
            }
        }
        // Similar logic for "reply"
        return false;
    }
}