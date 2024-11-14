class RoomChannel < ApplicationCable::Channel
  def subscribed
    # TODO: should we only do ensure stream  if current account is present?
    # for now going ahead with guard clauses in update_subscription and broadcast_presence
    log_params
    ensure_stream
    current_user
    current_account
    update_subscription
    broadcast_presence
  end

  def log_params
    contact_inbox = ContactInbox.find_by(pubsub_token: params[:pubsub_token])
    inbox_id = contact_inbox&.inbox_id
    account_id = contact_inbox&.inbox&.account_id
    Rails.logger.info("update_presence: #{params.inspect}, inbox_id: #{inbox_id}, account_id: #{account_id}")
  end

  def update_presence
    log_params
    update_subscription
    broadcast_presence
  end

  private

  def broadcast_presence
    return if @current_account.blank?

    data = { account_id: @current_account.id, users: ::OnlineStatusTracker.get_available_users(@current_account.id) }
    data[:contacts] = ::OnlineStatusTracker.get_available_contacts(@current_account.id) if @current_user.is_a? User
    ActionCable.server.broadcast(@pubsub_token, { event: 'presence.update', data: data })
  end

  def ensure_stream
    @pubsub_token = params[:pubsub_token]
    stream_from @pubsub_token
  end

  def update_subscription
    return if @current_account.blank?

    ::OnlineStatusTracker.update_presence(@current_account.id, @current_user.class.name, @current_user.id)
  end

  def current_user
    @current_user ||= if params[:user_id].blank?
                        ContactInbox.find_by!(pubsub_token: @pubsub_token).contact
                      else
                        User.find_by!(pubsub_token: @pubsub_token, id: params[:user_id])
                      end
  end

  def current_account
    return if current_user.blank?

    @current_account ||= if @current_user.is_a? Contact
                           @current_user.account
                         else
                           @current_user.accounts.find(params[:account_id])
                         end
  end
end
