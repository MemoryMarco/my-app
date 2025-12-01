package com.liuyansh.service;
import com.liuyansh.entity.Like;
import com.liuyansh.entity.Message;
import com.liuyansh.entity.Reply;
import com.liuyansh.entity.Settings;
import com.liuyansh.repository.LikeRepository;
import com.liuyansh.repository.MessageRepository;
import com.liuyansh.repository.ReplyRepository;
import com.liuyansh.repository.SettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.time.Instant;
import java.util.List;
@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final SettingsRepository settingsRepository;
    private final MessageRepository messageRepository;
    private final ReplyRepository replyRepository;
    private final LikeRepository likeRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    public EmailService(SettingsRepository settingsRepository, MessageRepository messageRepository, ReplyRepository replyRepository, LikeRepository likeRepository) {
        this.settingsRepository = settingsRepository;
        this.messageRepository = messageRepository;
        this.replyRepository = replyRepository;
        this.likeRepository = likeRepository;
    }
    @Transactional
    public void sendWeeklyEmail() {
        logger.info("Executing sendWeeklyEmail job...");
        Settings settings = settingsRepository.findById("app-settings").orElse(new Settings());
        if (settings.getRecipient() == null || settings.getRecipient().isEmpty()) {
            logger.warn("Recipient email not configured. Skipping email job.");
            return;
        }
        Instant lastSent = settings.getLastSentTs() == null ? Instant.EPOCH : settings.getLastSentTs();
        List<Message> newMessages = messageRepository.findByTsAfter(lastSent);
        List<Reply> newReplies = replyRepository.findByTsAfter(lastSent);
        List<Like> newLikes = likeRepository.findByTsAfter(lastSent);
        if (newMessages.isEmpty() && newReplies.isEmpty() && newLikes.isEmpty()) {
            logger.info("No new activity. Skipping email.");
            return;
        }
        String emailBody = buildEmailBody(newMessages, newReplies, newLikes);
        if ("mock".equals(settings.getProvider())) {
            logger.info("Mock sending email to {}: {}", settings.getRecipient(), emailBody);
        } else {
            // Implement actual HTTP sending logic here using RestTemplate
            logger.info("HTTP sending not implemented in this demo.");
        }
        settings.setLastSentTs(Instant.now());
        // Add to send logs (simplified)
        settingsRepository.save(settings);
        logger.info("Email job finished successfully.");
    }
    private String buildEmailBody(List<Message> messages, List<Reply> replies, List<Like> likes) {
        StringBuilder sb = new StringBuilder();
        sb.append("Liuyan Studio Weekly Digest\n\n");
        sb.append("New Messages: ").append(messages.size()).append("\n");
        sb.append("New Replies: ").append(replies.size()).append("\n");
        sb.append("New Likes: ").append(likes.size()).append("\n\n");
        messages.forEach(m -> sb.append("- ").append(m.getText()).append("\n"));
        return sb.toString();
    }
}